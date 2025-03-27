from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Avg, F, Q
from django.contrib.auth import get_user_model
from .models import Review, ProviderRating
from .serializers import ReviewSerializer, ProviderRatingSerializer, TopProviderSerializer
from expertconnect.users.permissions import IsOwnerOrAdmin

User = get_user_model()

class ReviewViewSet(viewsets.ModelViewSet):
    """
    API viewset for managing reviews
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Filter reviews based on query parameters
        queryset = Review.objects.all()
        
        # Filter by provider
        provider_id = self.request.query_params.get('provider', None)
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        
        # Filter by consumer
        consumer_id = self.request.query_params.get('consumer', None)
        if consumer_id:
            queryset = queryset.filter(consumer_id=consumer_id)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        # Filter by recommendation
        recommended = self.request.query_params.get('recommended', None)
        if recommended is not None:
            recommended = recommended.lower() == 'true'
            queryset = queryset.filter(would_recommend=recommended)
        
        return queryset
    
    def get_permissions(self):
        """
        Custom permissions:
        - Anyone can view reviews
        - Only authenticated users can create reviews
        - Only the review creator or admin can update/delete reviews
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get reviews created by the current user"""
        reviews = Review.objects.filter(consumer=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def reviews_about_me(self, request):
        """Get reviews about the current user (if they're a provider)"""
        if not request.user.is_provider:
            return Response(
                {"detail": "You are not registered as a provider."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reviews = Review.objects.filter(provider=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

class ProviderRatingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API viewset for retrieving provider ratings
    """
    serializer_class = ProviderRatingSerializer
    permission_classes = [permissions.AllowAny]
    queryset = ProviderRating.objects.all()
    
    def get_queryset(self):
        # Filter ratings based on query parameters
        queryset = ProviderRating.objects.all()
        
        # Filter by provider
        provider_id = self.request.query_params.get('provider', None)
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(average_rating__gte=min_rating)
        
        # Filter by minimum reviews
        min_reviews = self.request.query_params.get('min_reviews', None)
        if min_reviews:
            queryset = queryset.filter(review_count__gte=min_reviews)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def top_providers(self, request):
        """
        Get top providers based on ranking score
        Optional query parameters:
        - limit: Number of providers to return (default 10)
        - category: Filter by category ID
        - min_rating: Minimum average rating
        - min_reviews: Minimum number of reviews
        """
        # Get query parameters
        limit = int(request.query_params.get('limit', 10))
        category_id = request.query_params.get('category', None)
        min_rating = request.query_params.get('min_rating', None)
        min_reviews = request.query_params.get('min_reviews', None)
        
        # Start with all providers
        queryset = User.objects.filter(
            Q(role='provider') | Q(role='both'),
            is_available_for_hire=True
        ).select_related('rating_metrics')
        
        # Apply filters
        if category_id:
            queryset = queryset.filter(skills__category_id=category_id).distinct()
        
        if min_rating:
            queryset = queryset.filter(rating_metrics__average_rating__gte=min_rating)
        
        if min_reviews:
            queryset = queryset.filter(rating_metrics__review_count__gte=min_reviews)
        
        # Order by ranking score and limit results
        queryset = queryset.order_by('-rating_metrics__ranking_score')[:limit]
        
        serializer = TopProviderSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recalculate_all(self, request):
        """
        Admin-only endpoint to recalculate all provider ratings
        """
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all provider ratings
        provider_ratings = ProviderRating.objects.all()
        
        # Recalculate ranking scores
        for rating in provider_ratings:
            rating.calculate_ranking_score()
        
        return Response({"detail": f"Recalculated {provider_ratings.count()} provider ratings."})
