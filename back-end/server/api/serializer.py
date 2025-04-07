from rest_framework import serializers
from .models import VirtualNumber,Message

class VirtualNumberSerializer(serializers.ModelSerializer):
    
    unread_count=serializers.SerializerMethodField()
    
    class Meta:
        model=VirtualNumber
        fields='__all__'
        
        
    def get_unread_count(self,obj):
        return obj.messages.filter(is_read=False).count()
    
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model=Message
        fields='__all__'