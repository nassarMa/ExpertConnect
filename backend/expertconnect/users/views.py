"""
Views for the users app.
"""

from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import UserSkill, Category, UserAvailability
from .serializers import (
    UserSerializer, UserProfileSerializer, UserSkillSerializer, 
    CategorySerializer, UserAvailabilitySerializer,
    UserSkillCreateSerializer, UserAvailabilityCreateSerializer
)

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter users based on query parameters.
        """
        queryset = User.objects.all()
        skill = self.request.query_params.get('skill', None)
        
        if skill:
            queryset = queryset.filter(skills__skill_name__icontains=skill)
            
        return queryset.distinct()
    
    def get_serializer_class(self):
        if self.action == 'update_profile':
            return UserProfileSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get the current user's profile.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """
        Update the current user's profile.
        """
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserSkillViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user skills.
    """
    queryset = UserSkill.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserSkillCreateSerializer
        return UserSkillSerializer
    
    def get_queryset(self):
        """
        Filter skills to only show the current user's skills.
        """
        return UserSkill.objects.filter(user=self.request.user)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class UserAvailabilityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user availability.
    """
    queryset = UserAvailability.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserAvailabilityCreateSerializer
        return UserAvailabilitySerializer
    
    def get_queryset(self):
        """
        Filter availability to only show the current user's availability.
        """
        user_id = self.request.query_params.get('user_id', None)
        
        if user_id:
            return UserAvailability.objects.filter(user_id=user_id)
        
        return UserAvailability.objects.filter(user=self.request.user)
