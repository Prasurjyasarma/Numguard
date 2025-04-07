from django.db import models

# Create your models here.

class VirtualNumber(models.Model):
    CATEGORY_CHOICES=[
        ('social-media', 'Social Media'),
        ('e-commerce', 'E-commerce'),
    ]
    numbers=models.CharField(max_length=10)
    category=models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    is_active=models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.numbers}-{self.category}"
    
    
class Message(models.Model):
    virtual_number=models.ForeignKey(VirtualNumber,on_delete=models.CASCADE,related_name='messages')
    sender=models.CharField(max_length=100)
    message_body=models.TextField()
    is_read=models.BooleanField(default=False)
    received_at=models.DateTimeField(null=True,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering=['-created_at']
    
    def __str__(self):
        return f"From {self.sender_number} to {self.virtual_number.number}"
    