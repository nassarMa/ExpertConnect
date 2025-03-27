from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ExpertSearch, ExpertTag, ExpertSpecialization, ExpertAvailabilitySlot
from expertconnect.users.models import Category
from expertconnect.reviews.serializers import ExpertProfileSerializer

User = get_user_model()

class ExpertTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpertTag
        fields = ['id', 'name', 'description']


class ExpertSpecializationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = ExpertTagSerializer(many=True, read_only=True)
    
    class Meta:
        model = ExpertSpecialization
        fields = [
            'id', 'expert', 'category', 'category_name', 'description',
            'years_experience', 'is_primary', 'tags'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        # Set expert to current user if not provided
        if 'expert' not in validated_data:
            validated_data['expert'] = self.context['request'].user
        return super().create(validated_data)


class ExpertSpecializationCreateSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(
        queryset=ExpertTag.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = ExpertSpecialization
        fields = [
            'category', 'description', 'years_experience', 
            'is_primary', 'tags'
        ]
    
    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        validated_data['expert'] = self.context['request'].user
        
        # Check if this is a primary specialization
        if validated_data.get('is_primary', False):
            # Set all other specializations to non-primary
            ExpertSpecialization.objects.filter(
                expert=self.context['request'].user,
                is_primary=True
            ).update(is_primary=False)
        
        specialization = ExpertSpecialization.objects.create(**validated_data)
        
        # Add tags
        if tags:
            specialization.tags.set(tags)
        
        return specialization


class ExpertAvailabilitySlotSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpertAvailabilitySlot
        fields = ['id', 'expert', 'start_time', 'end_time', 'is_booked', 'duration']
        read_only_fields = ['id', 'is_booked']
    
    def get_duration(self, obj):
        return obj.duration_minutes()
    
    def validate(self, data):
        # Ensure end time is after start time
        if data['end_time'] <= data['start_time']:
            raise serializers.ValidationError("End time must be after start time")
        
        # Check for overlapping slots
        overlapping = ExpertAvailabilitySlot.objects.filter(
            expert=data['expert'],
            start_time__lt=data['end_time'],
            end_time__gt=data['start_time']
        )
        
        # Exclude current instance in case of update
        if self.instance:
            overlapping = overlapping.exclude(id=self.instance.id)
        
        if overlapping.exists():
            raise serializers.ValidationError("This slot overlaps with an existing availability slot")
        
        return data
    
    def create(self, validated_data):
        # Set expert to current user if not provided
        if 'expert' not in validated_data:
            validated_data['expert'] = self.context['request'].user
        return super().create(validated_data)


class ExpertSearchSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = ExpertSearch
        fields = [
            'id', 'user', 'query', 'category', 'category_name',
            'min_rating', 'max_price', 'location', 'created_at',
            'result_count'
        ]
        read_only_fields = ['id', 'created_at', 'result_count']


class ExpertSearchResultSerializer(serializers.ModelSerializer):
    profile = ExpertProfileSerializer(source='expertprofile', read_only=True)
    specializations = ExpertSpecializationSerializer(many=True, read_only=True)
    availability_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'profile_picture', 'bio', 'headline', 'location',
            'profile', 'specializations', 'availability_count'
        ]
    
    def get_availability_count(self, obj):
        return obj.availability_slots.filter(is_booked=False).count()


class ExpertDetailSerializer(serializers.ModelSerializer):
    profile = ExpertProfileSerializer(source='expertprofile', read_only=True)
    specializations = ExpertSpecializationSerializer(many=True, read_only=True)
    skills = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'profile_picture', 'bio', 'headline', 'location',
            'profile', 'specializations', 'skills', 'availability'
        ]
    
    def get_skills(self, obj):
        return [
            {
                'id': skill.id,
                'name': skill.skill_name,
                'level': skill.skill_level,
                'years': skill.years_experience
            }
            for skill in obj.skills.all()
        ]
    
    def get_availability(self, obj):
        # Get upcoming availability slots
        from django.utils import timezone
        slots = obj.availability_slots.filter(
            end_time__gte=timezone.now(),
            is_booked=False
        ).order_by('start_time')[:10]
        
        return [
            {
                'id': slot.id,
                'start': slot.start_time,
                'end': slot.end_time,
                'duration': slot.duration_minutes()
            }
            for slot in slots
        ]


class CategoryWithExpertsSerializer(serializers.ModelSerializer):
    expert_count = serializers.SerializerMethodField()
    top_experts = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'expert_count', 'top_experts']
    
    def get_expert_count(self, obj):
        return obj.specialists.count()
    
    def get_top_experts(self, obj):
        # Get top 3 experts in this category by rating
        experts = User.objects.filter(
            specializations__category=obj,
            role='expert'
        ).order_by('-expertprofile__rating_score')[:3]
        
        return [
            {
                'id': expert.id,
                'name': f"{expert.first_name} {expert.last_name}",
                'profile_picture': expert.profile_picture.url if expert.profile_picture else None,
                'rating': getattr(expert.expertprofile, 'rating_score', 0)
            }
            for expert in experts
        ]
