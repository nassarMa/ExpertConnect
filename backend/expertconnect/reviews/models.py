from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()

class Review(models.Model):
    """
    Model to store reviews and ratings for providers
    """
    RATING_CHOICES = (
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    )
    
    provider = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_reviews'
    )
    consumer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='given_reviews'
    )
    rating = models.IntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    expertise_rating = models.IntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    communication_rating = models.IntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    value_rating = models.IntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    would_recommend = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('provider', 'consumer')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review for {self.provider.username} by {self.consumer.username}"


class ProviderRating(models.Model):
    """
    Model to store aggregated provider ratings and metrics
    Updated by signals when reviews are created/updated/deleted
    """
    provider = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='rating_metrics'
    )
    average_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        default=0.0
    )
    expertise_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        default=0.0
    )
    communication_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        default=0.0
    )
    value_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        default=0.0
    )
    review_count = models.PositiveIntegerField(default=0)
    recommendation_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        default=0.0
    )
    completed_sessions = models.PositiveIntegerField(default=0)
    response_time_minutes = models.PositiveIntegerField(default=0)
    ranking_score = models.DecimalField(
        max_digits=10, 
        decimal_places=4,
        default=0.0
    )
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Rating metrics for {self.provider.username}"
    
    def calculate_ranking_score(self):
        """
        Calculate the provider's ranking score based on multiple factors:
        - Average rating (weighted by number of reviews)
        - Number of completed sessions
        - Recommendation percentage
        - Response time (inverse relationship - faster is better)
        
        This algorithm prioritizes providers with consistent positive feedback,
        more experience, and good communication habits.
        """
        # Base score from average rating
        rating_score = float(self.average_rating) * 10  # Scale to 0-50
        
        # Weight by number of reviews (more reviews = more reliable)
        review_weight = min(self.review_count / 10, 1.0)  # Cap at 1.0
        weighted_rating = rating_score * (0.5 + (0.5 * review_weight))
        
        # Factor in completed sessions (experience)
        experience_score = min(self.completed_sessions / 20, 1.0) * 20  # Scale to 0-20
        
        # Factor in recommendation percentage
        recommendation_score = float(self.recommendation_percentage) / 5  # Scale to 0-20
        
        # Factor in response time (inverse relationship)
        if self.response_time_minutes > 0:
            response_factor = max(1 - (self.response_time_minutes / 1440), 0.1)  # 1440 minutes = 24 hours
        else:
            response_factor = 0.5  # Default if no data
        response_score = response_factor * 10  # Scale to 0-10
        
        # Calculate final score
        final_score = weighted_rating + experience_score + recommendation_score + response_score
        
        # Update the model
        self.ranking_score = final_score
        self.save(update_fields=['ranking_score'])
        
        return final_score
