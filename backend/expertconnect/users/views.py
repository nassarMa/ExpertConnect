from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserSkillSerializer,
    UserAvailabilitySerializer,
    CategorySerializer
)
from .models import UserSkill, UserAvailability, Category
from .permissions import IsOwnerOrAdmin

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    """
    API view for user registration with role selection
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return user profile data after successful registration
        profile_serializer = UserProfileSerializer(user)
        return Response(
            {
                "message": "User registered successfully",
                "user": profile_serializer.data
            },
            status=status.HTTP_201_CREATED
        )

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    API viewset for user profile management
    """
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        # Regular users can only see their own profile
        if self.request.user.is_staff or self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_me(self, request):
        """Update current user's profile"""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class UserSkillViewSet(viewsets.ModelViewSet):
    """
    API viewset for managing user skills
    """
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        # Filter skills by user
        user_id = self.kwargs.get('user_pk')
        if user_id:
            return UserSkill.objects.filter(user_id=user_id)
        return UserSkill.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Set user automatically when creating a skill
        user_id = self.kwargs.get('user_pk')
        if user_id and (self.request.user.is_staff or self.request.user.is_superuser):
            serializer.save(user_id=user_id)
        else:
            serializer.save(user=self.request.user)

class UserAvailabilityViewSet(viewsets.ModelViewSet):
    """
    API viewset for managing user availability
    """
    serializer_class = UserAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        # Filter availability by user
        user_id = self.kwargs.get('user_pk')
        if user_id:
            return UserAvailability.objects.filter(user_id=user_id)
        return UserAvailability.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Set user automatically when creating availability
        user_id = self.kwargs.get('user_pk')
        if user_id and (self.request.user.is_staff or self.request.user.is_superuser):
            serializer.save(user_id=user_id)
        else:
            serializer.save(user=self.request.user)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API viewset for listing and retrieving categories
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
