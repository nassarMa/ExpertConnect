from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import (
    ExpertSearch, ExpertTag, ExpertSpecialization, 
    ExpertAvailabilitySlot, ExpertDiscoveryService
)
from .serializers import (
    ExpertTagSerializer, ExpertSpecializationSerializer,
    ExpertSpecializationCreateSerializer, ExpertAvailabilitySlotSerializer,
    ExpertSearchSerializer, ExpertSearchResultSerializer,
    ExpertDetailSerializer, CategoryWithExpertsSerializer
)
from expertconnect.users.models import Category

User = get_user_model()

class ExpertTagViewSet(viewsets.ModelViewSet):
    """
    API endpoint for expert tags.
    """
    queryset = ExpertTag.objects.all()
    serializer_class = ExpertTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class ExpertSpecializationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for expert specializations.
    """
    queryset = ExpertSpecialization.objects.all()
    serializer_class = ExpertSpecializationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExpertSpecializationCreateSerializer
        return ExpertSpecializationSerializer
    
    def get_queryset(self):
        # Filter by expert
        expert_id = self.request.query_params.get('expert', None)
        if expert_id:
            return ExpertSpecialization.objects.filter(expert_id=expert_id)
        
        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            return ExpertSpecialization.objects.filter(category_id=category_id)
        
        # For non-admin users, only show their own specializations
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return ExpertSpecialization.objects.filter(expert=self.request.user)
        
        return ExpertSpecialization.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(expert=self.request.user)


class ExpertAvailabilitySlotViewSet(viewsets.ModelViewSet):
    """
    API endpoint for expert availability slots.
    """
    queryset = ExpertAvailabilitySlot.objects.all()
    serializer_class = ExpertAvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Filter by expert
        expert_id = self.request.query_params.get('expert', None)
        if expert_id:
            return ExpertAvailabilitySlot.objects.filter(expert_id=expert_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        queryset = ExpertAvailabilitySlot.objects.all()
        
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(end_time__lte=end_date)
        
        # Filter by availability
        available_only = self.request.query_params.get('available_only', None)
        if available_only and available_only.lower() == 'true':
            queryset = queryset.filter(is_booked=False)
        
        # For non-admin users, only show their own slots or available slots
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(
                Q(expert=self.request.user) | 
                Q(is_booked=False)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(expert=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple availability slots at once.
        """
        slots = request.data.get('slots', [])
        created_slots = []
        
        for slot_data in slots:
            serializer = self.get_serializer(data=slot_data)
            if serializer.is_valid():
                serializer.save(expert=request.user)
                created_slots.append(serializer.data)
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(created_slots, status=status.HTTP_201_CREATED)


class ExpertSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for expert searches.
    """
    queryset = ExpertSearch.objects.all()
    serializer_class = ExpertSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # For non-admin users, only show their own searches
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return ExpertSearch.objects.filter(user=self.request.user)
        
        return ExpertSearch.objects.all()


class ExpertDiscoveryViewSet(viewsets.ViewSet):
    """
    API endpoint for expert discovery.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search for experts based on various criteria.
        """
        # Get search parameters
        query = request.query_params.get('query', None)
        category = request.query_params.get('category', None)
        min_rating = request.query_params.get('min_rating', None)
        max_price = request.query_params.get('max_price', None)
        location = request.query_params.get('location', None)
        tags = request.query_params.getlist('tags', None)
        available_now = request.query_params.get('available_now', 'false').lower() == 'true'
        
        # Convert to appropriate types
        if category:
            category = int(category)
        
        if min_rating:
            min_rating = float(min_rating)
        
        if max_price:
            max_price = float(max_price)
        
        if tags:
            tags = [int(tag) for tag in tags]
        
        # Perform search
        experts = ExpertDiscoveryService.search_experts(
            query=query,
            category=category,
            min_rating=min_rating,
            max_price=max_price,
            location=location,
            tags=tags,
            available_now=available_now,
            user=request.user
        )
        
        # Serialize results
        serializer = ExpertSearchResultSerializer(experts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        Get personalized expert recommendations.
        """
        limit = int(request.query_params.get('limit', 5))
        experts = ExpertDiscoveryService.get_recommended_experts(
            user=request.user,
            limit=limit
        )
        
        serializer = ExpertSearchResultSerializer(experts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """
        Get trending experts.
        """
        category = request.query_params.get('category', None)
        days = int(request.query_params.get('days', 7))
        limit = int(request.query_params.get('limit', 10))
        
        if category:
            category = int(category)
        
        experts = ExpertDiscoveryService.get_trending_experts(
            category=category,
            days=days,
            limit=limit
        )
        
        serializer = ExpertSearchResultSerializer(experts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Get categories with expert counts and top experts.
        """
        categories = Category.objects.annotate(
            expert_count=Count('specialists')
        ).filter(expert_count__gt=0)
        
        serializer = CategoryWithExpertsSerializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def expert_detail(self, request, pk=None):
        """
        Get detailed information about an expert.
        """
        try:
            expert = User.objects.get(pk=pk, role='expert')
        except User.DoesNotExist:
            return Response(
                {"detail": "Expert not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ExpertDetailSerializer(expert)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """
        Get availability slots for an expert.
        """
        try:
            expert = User.objects.get(pk=pk, role='expert')
        except User.DoesNotExist:
            return Response(
                {"detail": "Expert not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        # Default to next 30 days if not specified
        if not start_date:
            start_date = timezone.now()
        
        if not end_date:
            end_date = start_date + timezone.timedelta(days=30)
        
        # Get available slots
        slots = ExpertAvailabilitySlot.objects.filter(
            expert=expert,
            start_time__gte=start_date,
            end_time__lte=end_date,
            is_booked=False
        ).order_by('start_time')
        
        serializer = ExpertAvailabilitySlotSerializer(slots, many=True)
        return Response(serializer.data)
