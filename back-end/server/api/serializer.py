from rest_framework import serializers
from .models import VirtualNumber,Message,PhysicalNumber


class PhysicalNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model=PhysicalNumber
        fields='__all__'

class VirtualNumberSerializer(serializers.ModelSerializer):
    
    unread_count=serializers.SerializerMethodField()
    
    class Meta:
        model=VirtualNumber
        fields='__all__'
        
    def get_unread_count(self,obj):
        return obj.messages.filter(is_read=False).count()
    
    def validate(self, data):
        physical_number = data.get('physical_number')
        instance = self.instance

        # If this is an update operation and physical_number hasn't changed, no need to check
        if instance and instance.physical_number == physical_number:
            return data

        # Check if the physical number already has 3 virtual numbers
        existing_count = VirtualNumber.objects.filter(physical_number=physical_number).count()
        
        # If updating an existing instance, don't count the current instance
        if instance and instance.physical_number == physical_number:
            existing_count -= 1
            
        if existing_count >= 3:
            raise serializers.ValidationError("A physical number can have a maximum of 3 virtual numbers.")
        
        # Check if this category is already assigned to this physical number
        if VirtualNumber.objects.filter(
            physical_number=physical_number, 
            category=data.get('category')
        ).exists():
            # If we're updating the current instance with the same category, this is fine
            if not (instance and instance.physical_number == physical_number and instance.category == data.get('category')):
                raise serializers.ValidationError(f"This physical number already has a virtual number for {data.get('category')}")
            
        return data
    
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model=Message
        fields='__all__'