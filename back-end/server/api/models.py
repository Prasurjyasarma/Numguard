from django.db import models

# Create your models here.

class PhysicalNumber(models.Model):
    number=models.CharField(max_length=10,unique=True)
    owner_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.number}-{self.owner_name}"
    
    def has_capacity_for_virtual_number(self):
        return self.virtual_numbers.count() < 3

class VirtualNumber(models.Model):
    CATEGORY_CHOICES=[
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal','Personal')
    ]
    numbers=models.CharField(max_length=10)
    category=models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    physical_number=models.ForeignKey(PhysicalNumber,on_delete=models.CASCADE,related_name='virtual_numbers')
    is_active=models.BooleanField(default=True)
    is_message_active=models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.numbers}-{self.category}"
    
    class Meta:
        constraints=[
            models.UniqueConstraint(
                fields=['physical_number','category'],
                name='unique_virtual_number_per_category'
            ),
            models.UniqueConstraint(
                fields=['numbers'],
                name='unique_virtual_number'
            )
        ]
        

class DeletedVirtualNumber(models.Model):
    CATEGORY_CHOICES = [
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal', 'Personal')
    ]
    number = models.CharField(max_length=10)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    physical_number=models.ForeignKey(PhysicalNumber,on_delete=models.CASCADE,related_name='deleted_virtual_numbers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.number}-{self.category}"
    
    
class Message(models.Model):
    CATEGORY_CHOICES=[
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
        ('personal','Personal')
    ]
    virtual_number=models.ForeignKey(VirtualNumber,on_delete=models.CASCADE,related_name='messages')
    category=models.CharField(max_length=20,choices=CATEGORY_CHOICES)
    sender=models.CharField(max_length=100)
    message_body=models.TextField()
    is_read=models.BooleanField(default=False)
    received_at=models.DateTimeField(null=True,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering=['-created_at']
    
    def __str__(self):
        return f"From {self.sender} to {self.virtual_number.numbers}"