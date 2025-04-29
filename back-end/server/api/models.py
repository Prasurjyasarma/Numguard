"""
Virtual Number Management System Models

This module defines the database models for the virtual number management system.
The system allows users to create, manage, and recover virtual phone numbers across
different categories (e-commerce, social media, personal) with built-in cooldown
mechanisms to prevent abuse.

Key Features:
- Physical and Virtual number management
- Category-based number organization
- Message handling and storage
- Cooldown system for number creation and recovery
- Deletion and recovery tracking
"""

from django.db import models
from django.utils import timezone
import datetime

# Create your models here.

class PhysicalNumber(models.Model):
    """
    Represents a real phone number that can be linked to multiple virtual numbers.
    
    Each physical number can have up to 3 virtual numbers associated with it.
    The system tracks the active status and ownership of these numbers.
    """
    number = models.CharField(max_length=10, unique=True)
    owner_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.number}-{self.owner_name}"
    
    def has_capacity_for_virtual_number(self):
        """Check if the physical number can accept more virtual numbers."""
        return self.virtual_numbers.count() < 3

class VirtualNumber(models.Model):
    """
    Represents a virtual phone number that is linked to a physical number.
    
    Virtual numbers are categorized into three types:
    - Social Media
    - E-commerce
    - Personal
    
    Each virtual number can be independently activated/deactivated for
    calls and messages.
    """
    CATEGORY_CHOICES = [
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal', 'Personal')
    ]
    numbers = models.CharField(max_length=10)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    physical_number = models.ForeignKey(PhysicalNumber, on_delete=models.CASCADE, related_name='virtual_numbers')
    is_active = models.BooleanField(default=True)
    is_message_active = models.BooleanField(default=True)
    is_call_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.numbers}-{self.category}"
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['physical_number', 'category'],
                name='unique_virtual_number_per_category'
            ),
            models.UniqueConstraint(
                fields=['numbers'],
                name='unique_virtual_number'
            )
        ]
        
    
class Message(models.Model):
    """
    Stores messages received by virtual numbers.
    
    Tracks message metadata including:
    - Sender information
    - Read status
    - Category association
    - Timestamps
    """
    CATEGORY_CHOICES = [
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal', 'Personal')
    ]
    virtual_number = models.ForeignKey(VirtualNumber, on_delete=models.CASCADE, related_name='messages')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    sender = models.CharField(max_length=100)
    message_body = models.TextField()
    is_read = models.BooleanField(default=False)
    received_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"From {self.sender} to {self.virtual_number.numbers}"
    
    
class DeletedVirtualNumber(models.Model):
    """
    Keeps track of deleted virtual numbers for auditing purposes.
    
    This model stores a history of deleted numbers and their associated metadata,
    allowing for tracking and analysis of number deletion patterns.
    """
    CATEGORY_CHOICES = [
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal', 'Personal')
    ]
    number = models.CharField(max_length=10)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    physical_number = models.ForeignKey(PhysicalNumber, on_delete=models.CASCADE, related_name='deleted_virtual_numbers')
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-deleted_at']
    
    def __str__(self):
        return f"{self.number}-{self.category}"



class RecoverableVirtualNumber(models.Model):
    """
    Stores recently deleted virtual numbers that can be recovered.
    
    This model maintains a temporary copy of deleted virtual numbers and their
    settings, allowing for recovery within the specified cooldown period.
    """
    CATEGORY_CHOICES = [
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal', 'Personal')
    ]
    number = models.CharField(max_length=10)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    physical_number = models.ForeignKey(PhysicalNumber, on_delete=models.CASCADE, related_name='recoverable_virtual_numbers')
    is_active = models.BooleanField(default=True)
    is_message_active = models.BooleanField(default=True)
    is_call_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-deleted_at']
    
    def __str__(self):
        return f"{self.number}-{self.category}"


class RecoverableMessage(models.Model):
    """
    Stores messages associated with recoverable virtual numbers.
    
    This model maintains copies of messages that were associated with deleted
    virtual numbers, allowing them to be restored if the number is recovered.
    """
    CATEGORY_CHOICES = [
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal', 'Personal')
    ]
    recoverable_virtual_number = models.ForeignKey(RecoverableVirtualNumber, on_delete=models.CASCADE, related_name='recoverable_messages')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    sender = models.CharField(max_length=100)
    message_body = models.TextField()
    is_read = models.BooleanField(default=False)
    received_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"From {self.sender} to {self.recoverable_virtual_number.number}"
    

class CategoryCooldown(models.Model):
    """
    Manages cooldown periods for virtual number operations.
    
    This model implements two types of cooldowns:
    1. Category-specific cooldown: Prevents creating multiple numbers in the same category
    2. Recovery cooldown: Prevents frequent recovery operations
    
    The cooldown system helps prevent abuse and ensures proper spacing between operations.
    """
    CATEGORY_CHOICES = [
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal', 'Personal')
    ]
    
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, unique=True)
    last_deleted_at = models.DateTimeField(null=True, blank=True)
    last_recovered_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Cooldown for {self.category}"
    
    def is_in_cooldown(self, cooldown_minutes=5):
        """
        Check if the category is in cooldown period for creation/deletion.
        This specifically checks the deletion cooldown, separate from recovery.
        
        Args:
            cooldown_minutes (int): The duration of the cooldown period in minutes
            
        Returns:
            tuple: (bool, timedelta) indicating if in cooldown and remaining time
        """
        if not self.last_deleted_at:
            return False, None
        
        time_since_deletion = timezone.now() - self.last_deleted_at
        cooldown_period = datetime.timedelta(minutes=cooldown_minutes)
        
        if time_since_deletion < cooldown_period:
            remaining_time = cooldown_period - time_since_deletion
            return True, remaining_time
        
        return False, None
    
    def is_in_recovery_cooldown(self, cooldown_minutes=5):
        """
        Check if the category is in recovery cooldown period.
        
        Args:
            cooldown_minutes (int): The duration of the recovery cooldown period in minutes
            
        Returns:
            tuple: (bool, timedelta) indicating if in cooldown and remaining time
        """
        if not self.last_recovered_at:
            return False, None
        
        time_since_recovery = timezone.now() - self.last_recovered_at
        cooldown_period = datetime.timedelta(minutes=cooldown_minutes)
        
        if time_since_recovery < cooldown_period:
            remaining_time = cooldown_period - time_since_recovery
            return True, remaining_time
        
        return False, None
    
    @classmethod
    def mark_deletion(cls, category):
        """Record a deletion operation for a category."""
        cooldown, created = cls.objects.get_or_create(category=category)
        cooldown.last_deleted_at = timezone.now()
        cooldown.save()
    
    @classmethod
    def mark_recovery(cls, category):
        """Record a recovery operation for a category."""
        cooldown, created = cls.objects.get_or_create(category=category)
        cooldown.last_recovered_at = timezone.now()
        cooldown.save()
        
    @classmethod
    def check_creation_cooldown(cls, category, cooldown_minutes=5):
        """
        Check if a new virtual number can be created in the given category.
        
        Args:
            category (str): The category to check
            cooldown_minutes (int): The duration of the cooldown period in minutes
            
        Returns:
            tuple: (bool, str) indicating if creation is allowed and error message if not
        """
        try:
            cooldown = cls.objects.get(category=category)
            in_cooldown, remaining_time = cooldown.is_in_cooldown(cooldown_minutes)
            
            if in_cooldown:
                remaining_minutes = int(remaining_time.total_seconds() // 60)
                remaining_seconds = int(remaining_time.total_seconds() % 60)
                error_message = f"Cannot create a {category} number yet. Please wait {remaining_minutes} min and {remaining_seconds} sec."
                return False, error_message
            
            return True, None
            
        except cls.DoesNotExist:
            return True, None