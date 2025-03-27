from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django.utils import timezone
from expertconnect.users.models import Category, UserSkill
from expertconnect.reviews.models import ExpertProfile

User = get_user_model()

class ExpertSearch(models.Model):
    """
    Model to store expert search queries and results for analytics.
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='searches',
        null=True,
        blank=True
    )
    query = models.CharField(max_length=255)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='searches'
    )
    min_rating = models.FloatField(null=True, blank=True)
    max_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    result_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Search: {self.query} by {self.user.username if self.user else 'Anonymous'}"


class ExpertTag(models.Model):
    """
    Model for expert tags to improve discoverability.
    """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name


class ExpertSpecialization(models.Model):
    """
    Model for expert specializations within categories.
    """
    expert = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='specializations'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='specialists'
    )
    description = models.TextField()
    years_experience = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    tags = models.ManyToManyField(ExpertTag, related_name='specializations', blank=True)
    
    class Meta:
        unique_together = ('expert', 'category')
    
    def __str__(self):
        return f"{self.expert.username} - {self.category.name}"


class ExpertAvailabilitySlot(models.Model):
    """
    Model for specific availability slots for experts.
    """
    expert = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='availability_slots'
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.expert.username} - {self.start_time.strftime('%Y-%m-%d %H:%M')} to {self.end_time.strftime('%H:%M')}"
    
    def duration_minutes(self):
        """Calculate duration in minutes"""
        delta = self.end_time - self.start_time
        return delta.total_seconds() / 60


class ExpertDiscoveryService:
    """
    Service class for expert discovery algorithms.
    """
    @staticmethod
    def search_experts(query=None, category=None, min_rating=None, 
                      max_price=None, location=None, tags=None, 
                      available_now=False, user=None):
        """
        Search for experts based on various criteria.
        
        Args:
            query (str): Search query for skills or username
            category (int): Category ID
            min_rating (float): Minimum rating score
            max_price (decimal): Maximum hourly rate
            location (str): Location search
            tags (list): List of tag IDs
            available_now (bool): Only show experts available now
            user (User): User performing the search (for personalization)
            
        Returns:
            QuerySet of User objects representing experts
        """
        # Start with all experts
        experts = User.objects.filter(role='expert', is_active=True)
        
        # Filter by query (search in username, skills, and bio)
        if query:
            experts = experts.filter(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(bio__icontains=query) |
                Q(skills__skill_name__icontains=query)
            ).distinct()
        
        # Filter by category
        if category:
            experts = experts.filter(
                Q(specializations__category_id=category) |
                Q(skills__skill_name__icontains=Category.objects.get(id=category).name)
            ).distinct()
        
        # Filter by minimum rating
        if min_rating:
            experts = experts.filter(expertprofile__rating_score__gte=min_rating)
        
        # Filter by maximum price
        if max_price:
            experts = experts.filter(
                Q(meetings_as_expert__hourly_rate__lte=max_price) |
                Q(meetings_as_expert__isnull=True)  # Include experts with no price set
            ).distinct()
        
        # Filter by location
        if location:
            experts = experts.filter(location__icontains=location)
        
        # Filter by tags
        if tags:
            for tag_id in tags:
                experts = experts.filter(specializations__tags__id=tag_id)
        
        # Filter by current availability
        if available_now:
            now = timezone.now()
            # Get day of week (0 = Monday, 6 = Sunday)
            day_of_week = now.weekday()
            # Get current time
            current_time = now.time()
            
            # Filter by general availability
            experts = experts.filter(
                availability__day_of_week=day_of_week,
                availability__start_time__lte=current_time,
                availability__end_time__gte=current_time,
                availability__is_available=True
            )
            
            # Also check specific availability slots
            experts = experts.filter(
                Q(availability_slots__start_time__lte=now),
                Q(availability_slots__end_time__gte=now),
                Q(availability_slots__is_booked=False)
            ).distinct()
        
        # Record search for analytics
        if query or category or min_rating or max_price or location:
            search = ExpertSearch.objects.create(
                user=user,
                query=query or "",
                category_id=category,
                min_rating=min_rating,
                max_price=max_price,
                location=location or "",
                result_count=experts.count()
            )
        
        return experts
    
    @staticmethod
    def get_recommended_experts(user, limit=5):
        """
        Get personalized expert recommendations for a user.
        
        Args:
            user (User): User to get recommendations for
            limit (int): Maximum number of recommendations
            
        Returns:
            QuerySet of User objects representing recommended experts
        """
        # Start with all experts
        experts = User.objects.filter(role='expert', is_active=True)
        
        # Exclude experts the user has already worked with
        experts = experts.exclude(
            meetings_as_expert__client=user
        )
        
        # Get user's interests based on previous searches and meetings
        user_searches = ExpertSearch.objects.filter(user=user)
        user_categories = set()
        user_skills = set()
        
        # Extract categories from searches
        for search in user_searches:
            if search.category:
                user_categories.add(search.category.id)
        
        # Extract skills from user profile
        for skill in user.skills.all():
            user_skills.add(skill.skill_name.lower())
        
        # Prioritize experts in user's categories of interest
        if user_categories:
            category_experts = experts.filter(
                specializations__category_id__in=user_categories
            ).annotate(
                relevance=Count('specializations', filter=Q(specializations__category_id__in=user_categories))
            )
        else:
            category_experts = experts.annotate(relevance=Count('specializations'))
        
        # Prioritize experts with skills matching user's interests
        skill_experts = []
        for expert in experts:
            skill_match_count = 0
            for skill in expert.skills.all():
                if skill.skill_name.lower() in user_skills:
                    skill_match_count += 1
            if skill_match_count > 0:
                skill_experts.append((expert, skill_match_count))
        
        # Sort by skill match count
        skill_experts.sort(key=lambda x: x[1], reverse=True)
        skill_expert_ids = [expert[0].id for expert in skill_experts[:limit]]
        
        # Combine results, prioritizing skill matches
        recommended = list(User.objects.filter(id__in=skill_expert_ids))
        
        # Add category matches if needed
        if len(recommended) < limit:
            for expert in category_experts.order_by('-relevance', '-expertprofile__rating_score'):
                if expert not in recommended:
                    recommended.append(expert)
                    if len(recommended) >= limit:
                        break
        
        # If still not enough, add top-rated experts
        if len(recommended) < limit:
            top_experts = experts.exclude(
                id__in=[e.id for e in recommended]
            ).order_by('-expertprofile__rating_score')[:limit-len(recommended)]
            
            recommended.extend(top_experts)
        
        return recommended[:limit]
    
    @staticmethod
    def get_trending_experts(category=None, days=7, limit=10):
        """
        Get trending experts based on recent bookings and ratings.
        
        Args:
            category (int): Optional category ID to filter by
            days (int): Number of days to consider for trending
            limit (int): Maximum number of experts to return
            
        Returns:
            List of User objects representing trending experts
        """
        # Calculate date threshold
        threshold_date = timezone.now() - timezone.timedelta(days=days)
        
        # Start with all experts
        experts = User.objects.filter(role='expert', is_active=True)
        
        # Filter by category if provided
        if category:
            experts = experts.filter(specializations__category_id=category)
        
        # Annotate with recent booking count
        experts = experts.annotate(
            recent_bookings=Count(
                'meetings_as_expert',
                filter=Q(meetings_as_expert__created_at__gte=threshold_date)
            )
        )
        
        # Annotate with recent rating average
        experts = experts.annotate(
            recent_rating=Avg(
                'reviews_received__rating',
                filter=Q(reviews_received__created_at__gte=threshold_date)
            )
        )
        
        # Calculate trending score (combination of bookings and ratings)
        trending_experts = []
        for expert in experts:
            # Base score from bookings (each booking = 10 points)
            booking_score = (expert.recent_bookings or 0) * 10
            
            # Rating score (rating * 5 points)
            rating_score = (expert.recent_rating or 0) * 5
            
            # Profile completeness score (up to 10 points)
            profile_score = 0
            if expert.profile_picture:
                profile_score += 3
            if expert.bio:
                profile_score += 3
            if expert.skills.count() > 0:
                profile_score += 2
            if expert.specializations.count() > 0:
                profile_score += 2
            
            # Total trending score
            trending_score = booking_score + rating_score + profile_score
            
            trending_experts.append((expert, trending_score))
        
        # Sort by trending score
        trending_experts.sort(key=lambda x: x[1], reverse=True)
        
        # Return top experts
        return [expert[0] for expert in trending_experts[:limit]]
