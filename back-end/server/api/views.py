from django.shortcuts import render
from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import VirtualNumber,Message
from .serializer import VirtualNumberSerializer,MessageSerializer
from rest_framework.permissions import AllowAny


# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def view_virtual_numbers(request):    
    virtual_numbers=VirtualNumber.objects.filter(is_active=True)
    serializer=VirtualNumberSerializer(virtual_numbers,many=True)
    return Response(serializer.data,status=status.HTTP_200_OK)

