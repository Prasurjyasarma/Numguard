from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import VirtualNumber, Message, PhysicalNumber, DeletedVirtualNumber
from .serializer import VirtualNumberSerializer, MessageSerializer, PhysicalNumberSerializer, DeletedVirtualNumberSerializer
from rest_framework.permissions import AllowAny
import random

#! ALGO TO GENERATE RANDOM NUMBER
st = random.randint(6, 9)
G = {
    0: [4, 6],
    1: [6, 8],
    2: [7, 9],
    3: [4, 8],
    4: [0, 3, 9],
    5: [],
    6: [0, 1, 7],
    7: [2, 6],
    8: [1, 3],
    9: [2, 4],
}

GEO_CODE_LENGTHS = {
    'IN': 10,
    'US': 12,
    'UK': 9,
    'DE': 11,
    'CA': 13
}

CATEGORY_CHOICES = ['social-media', 'e-commerce', 'personal']

def generate_random_number(n=10, start=st, G=G):
    number = str(start)
    current = start
    for _ in range(n - 1):
        if not G[current]:
            current = random.randint(0, 9)
        else:
            current = random.choice(G[current])
        number += str(current)
    return number

#! CREATE VIRTUAL NUMBER
@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def create_virtual_number(request):
    print("Incoming request data:", request.data)

    geo_code = request.data.get("geo_code", "").strip().upper()
    category = request.data.get("category", "").strip().lower()

    if not geo_code or not category:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if geo_code not in GEO_CODE_LENGTHS:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if category not in CATEGORY_CHOICES:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    n = GEO_CODE_LENGTHS[geo_code]
    number = generate_random_number(n=n)

    physical_number = PhysicalNumber.objects.filter(is_active=True).first()

    if not physical_number or not physical_number.has_capacity_for_virtual_number():
        return Response(status=status.HTTP_400_BAD_REQUEST)

    try:
        VirtualNumber.objects.create(
            numbers=number,
            category=category,
            physical_number=physical_number
        )
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        print("Error creating virtual number:", e)
        return Response(status=status.HTTP_400_BAD_REQUEST)

#! GET PHYSICAL NUMBERS
@api_view(["GET"])
@permission_classes([AllowAny])
def get_physical_numbers(request):
    physical_numbers = PhysicalNumber.objects.filter(is_active=True)
    serializer = PhysicalNumberSerializer(physical_numbers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

#! GET VIRTUAL NUMBERS
@api_view(['GET'])
@permission_classes([AllowAny])
def view_virtual_numbers(request):
    category=request.query_params.get('category')
    if category:
        virtual_numbers=VirtualNumber.objects.filter(category=category,is_active=True)
    else:
        virtual_numbers = VirtualNumber.objects.filter(is_active=True)
    
    serializer = VirtualNumberSerializer(virtual_numbers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)



#! DELETE VIRTUAL NUMBER
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_virtual_number(requset,virtual_number_id):
    try:
        virtual_number=VirtualNumber.objects.get(id=virtual_number_id)
        DeletedVirtualNumber.objects.create(
            number=virtual_number.numbers,
            category=virtual_number.category,
            physical_number=virtual_number.physical_number
        )
        virtual_number.delete()
        return Response({"message": "Virtual number deleted successfully"}, status=status.HTTP_200_OK)
    
    except VirtualNumber.DoesNotExist:
        return Response({"error": "Virtual number not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_HTTP_INTERNAL_SERVER_ERROR)    
        























#! GET PHYSICAL NUMBER BY VIRTUAL NUMBER
@api_view(["GET"])
@permission_classes([AllowAny])
def get_physical_number_by_virtual_number(request,virtual_number_id):
    try:
        virtual_number=VirtualNumber.objects.get(id=virtual_number_id)
        physical_number=virtual_number.physical_number
        serializer=PhysicalNumberSerializer(physical_number)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    except VirtualNumber.DoesNotExist:
        return Response(status=status.HTTP_404_BAD_REQUEST)
    
    
#! GET VIRTUAL NUMBER BY PHYSICAL NUMBER
@api_view(["GET"])    
@permission_classes([AllowAny])    
def get_virtual_number_by_physical_number(requset,physical_number_id):
    try:
        physical_number=PhysicalNumber.objects.filter(is_active=True).get(id=physical_number_id)
        virtual_numbers=VirtualNumber.objects.filter(physical_number=physical_number,is_active=True)
        serializer=VirtualNumberSerializer(virtual_numbers,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    except PhysicalNumber.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)