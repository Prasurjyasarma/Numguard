from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import VirtualNumber, Message, PhysicalNumber, DeletedVirtualNumber
from .serializer import VirtualNumberSerializer, MessageSerializer, PhysicalNumberSerializer, DeletedVirtualNumberSerializer
from rest_framework.permissions import AllowAny
import random
from django.utils import timezone


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
        virtual_numbers=VirtualNumber.objects.filter(category=category)
    else:
        virtual_numbers = VirtualNumber.objects.all()
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
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)    


#! DEACTIVATE AND ACTIVATEVIRTUAL NUMBER
@api_view(['POST'])
@permission_classes([AllowAny])
def deactivate_virtual_number(request, virtual_number_id):
    try:
        virtual_number = VirtualNumber.objects.get(id=virtual_number_id)
        if virtual_number.is_active:
            virtual_number.is_active = False
            virtual_number.save()
            return Response({'message': 'Successfully deactivated'}, status=status.HTTP_200_OK)
        else:
            virtual_number.is_active = True
            virtual_number.save()
            return Response({'message': 'Successfully activated'}, status=status.HTTP_200_OK)
    
    except VirtualNumber.DoesNotExist:
        return Response({'message': 'Virtual number not found'}, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#! DEACTIVATE AND ACTIVATEVIRTUAL MESSAGE
@api_view(['POST'])
@permission_classes([AllowAny])
def deactivate_virtual_number_message(request, virtual_number_id):
    try:
        virtual_number = VirtualNumber.objects.get(id=virtual_number_id)
        if virtual_number.is_message_active:
            virtual_number.is_message_active = False
            virtual_number.save()
            return Response({'message': 'Successfully Messages deactivated'}, status=status.HTTP_200_OK)
        else:
            virtual_number.is_message_active = True
            virtual_number.save()
            return Response({'message': 'Successfully Messages activated'}, status=status.HTTP_200_OK)
    
    except VirtualNumber.DoesNotExist:
        return Response({'message': 'Virtual number not found'}, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




#! GET TOTAL NOTIFICATION COUNT        
@api_view(['GET'])
@permission_classes([AllowAny])
def get_total_notifcation_count(request):
    try:
        total_notification=Message.objects.filter(is_read=False).count()
        if total_notification==0:
            return Response({'message':'No new notifications'},status=status.HTTP_200_OK)
        
        return Response({'total_notification':total_notification},status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({'error':str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



#! GETING MESSAGE FROM EXTERNAL WEBSITES (USE CASES)
@api_view(['GET'])
@permission_classes([AllowAny])
def receive_message(request):
    virtual_number=request.GET.get('virtual_number')
    sender_name = request.GET.get('sender_name')
    msg = request.GET.get('message')

    if not virtual_number or not msg or not sender_name:
        return Response({"message": "Both message and sender name are required"}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    try:
        virtual_number_obj=VirtualNumber.objects.get(numbers=virtual_number)
    except VirtualNumber.DoesNotExist:
        return Response({"message": "Virtual number not found"}, 
                        status=status.HTTP_404_NOT_FOUND)

    if not virtual_number_obj.is_message_active:
        return Response({"message": "Virtual number is not active"}, 
                        status=status.HTTP_400_BAD_REQUEST)

    if not virtual_number_obj.is_active:
        return Response({"message": "Virtual number is not active"}, 
                        status=status.HTTP_400_BAD_REQUEST)

    result = forward_message(virtual_number,sender_name, msg)
    
    if result.get('success'):
        return Response({
            "message": f"Message from {sender_name} received and processed successfully",
            "details": result
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            "message": "Failed to process Message",
            "details": result
        }, status=status.HTTP_400_BAD_REQUEST)


SENDER_CATEGORIES = {
    # E-commerce senders
    'shopeasy':'e-commerce',
    'amazon': 'e-commerce',
    'flipkart': 'e-commerce',
    'ebay': 'e-commerce',
    'walmart': 'e-commerce',

    # Social media senders
    'insta': 'social-media',
    'fb': 'social-media',
    'twitter': 'social-media',
    'linkedin': 'social-media',

    # Personal senders
    '12': 'personal',
    'personal': 'personal',
    'family': 'personal',
    'friend': 'personal',
}



#! SAVING IT IN DATABASE 
def forward_message(virtual_number,sender_name,msg):
    try:
        virtual_number_obj = VirtualNumber.objects.get(numbers=virtual_number)
        
        category = SENDER_CATEGORIES.get(sender_name.lower())
        
        if not category:
            return {
                'success': False, 
                'message': f"Unknown sender: {sender_name}"
            }
            
       
        if virtual_number_obj.category != category:
            return {
                'success': False, 
                'message': f"Category mismatch: Sender category '{category}' doesn't match virtual number category '{virtual_number_obj.category}'"
            }
        
        message = Message.objects.create(
            virtual_number=virtual_number_obj,
            sender=sender_name,
            message_body=msg,
            category=category,
            is_read=False,
            received_at=timezone.now()
        )
        
        return {
            'success': True,
            'category': category,
            'virtual_number': virtual_number,
            'message_details': {
                'id': message.id,
                'sender': message.sender,
                'category': message.category,
                'recipient': message.virtual_number.numbers,
                'message_body': message.message_body,
                'received_at': message.received_at
            }
        }
    
    except VirtualNumber.DoesNotExist:
        return {
            'success': False, 
            'message': f"Virtual number not found: {virtual_number}"
        }
    except Exception as e:
        return {
            'success': False,
            'message': f"Error processing message: {str(e)}"
        }
    

#! SENDING THE MESSAGE TO FRONT-END  
@api_view(['GET'])
@permission_classes([AllowAny])
def forward_message_to_front_end(request):
     category=request.GET.get('category')
     if not category:
          return Response({"error": "Category parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
     virtual_number=VirtualNumber.objects.filter(category=category)

     if not virtual_number.exists():
          return Response({"error": f"No active virtual numbers found for category: {category}"}, 
                          status=status.HTTP_404_NOT_FOUND)
     
     message=Message.objects.filter(virtual_number__in=virtual_number).order_by('-received_at')

     if not message:
          return Response({"message": f"No messages found for category: {category}"}, 
                          status=status.HTTP_404_NOT_FOUND)
     
     serializer=MessageSerializer(message,many=True)
     return Response(serializer.data,status=status.HTTP_200_OK)


#! SEEN MESAGE 
@api_view(['GET'])
@permission_classes([AllowAny])         
def read_message(request,message_id):
    try:
        message=Message.objects.get(id=message_id)
        if message.is_read == False:
            message.is_read=True
            message.save()
            return Response({'message':"Message read"}, status=status.HTTP_200_OK)
        return Response({'message':"Message already read"}, status=status.HTTP_200_OK)
    
    except Message.DoesNotExist:
        return Response({'message':"Message not found"},status=status.HTTP_404_NOT_FOUND)
    
    

#! DELETE MESSAGE     
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_message(request,message_id):
    try:
        message=Message.objects.get(id=message_id)
        message.delete()
        return Response({'message':'Message deleted successfully'},status=status.HTTP_200_OK)
    
    except Message.DoesNotExist:
        return Response({'message':'Message not found'},status=status.HTTP_400_BAD_REQUEST)
    

    


#! GET PHYSICAL NUMBER BY VIRTUAL NUMBER
@api_view(["GET"])
@permission_classes([AllowAny])
def get_physical_number_by_virtual_number(request, virtual_number):
    try:
        #? in active virtual numbers
        try:
            virtual_number_obj = VirtualNumber.objects.get(numbers=virtual_number)
            physical_number = virtual_number_obj.physical_number
            serializer = PhysicalNumberSerializer(physical_number)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except VirtualNumber.DoesNotExist:

            #? in deleted virtual numbers 
            try:
                deleted_virtual_number = DeletedVirtualNumber.objects.get(number=virtual_number)
                physical_number = deleted_virtual_number.physical_number
                serializer = PhysicalNumberSerializer(physical_number)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except DeletedVirtualNumber.DoesNotExist:
                # If not found in either model, return 404
                return Response({"error": "Virtual number not found in active or deleted records"}, 
                               status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


#! GET VIRTUAL NUMBER BY PHYSICAL NUMBER
@api_view(["GET"])    
@permission_classes([AllowAny])    
def get_virtual_number_by_physical_number(requset,physical_number):
    try:
        physical_number=PhysicalNumber.objects.filter(is_active=True).get(id=physical_number)
        virtual_numbers=VirtualNumber.objects.filter(physical_number=physical_number,is_active=True)
        serializer=VirtualNumberSerializer(virtual_numbers,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    except PhysicalNumber.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)