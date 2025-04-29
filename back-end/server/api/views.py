"""
Virtual Number Management System Views

This module implements the API endpoints for managing virtual phone numbers.
It provides functionality for creating, deleting, recovering, and managing
virtual numbers across different categories, with built-in cooldown mechanisms
to prevent abuse.

Key Features:
- Virtual number CRUD operations
- Category-based management
- Cooldown system integration
- Message handling
- Number recovery system
"""

from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import VirtualNumber, Message, PhysicalNumber, DeletedVirtualNumber,RecoverableMessage,RecoverableVirtualNumber,CategoryCooldown
from .serializer import VirtualNumberSerializer, MessageSerializer, PhysicalNumberSerializer, DeletedVirtualNumberSerializer
from rest_framework.permissions import AllowAny
import random
from django.utils import timezone


#! ==================== NUMBER GENERATION LOGIC ====================

# Starting digit for virtual numbers (6-9)
st = random.randint(6, 9)

# Graph representing valid digit connections for number generation
# Each key represents a digit, and its value array shows which digits can follow it
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

# Define number lengths for different country codes
GEO_CODE_LENGTHS = {
    'IN': 10,  # India: 10 digits
    'US': 12,  # United States: 12 digits
    'UK': 9,   # United Kingdom: 9 digits
    'DE': 11,  # Germany: 11 digits
    'CA': 13   # Canada: 13 digits
}

# Valid categories for virtual numbers
CATEGORY_CHOICES = ['social-media', 'e-commerce', 'personal']

def generate_random_number(n=10, start=st, G=G):
    """
    Generate a random virtual number using graph-based constraints.
    Each digit is chosen based on valid connections defined in graph G.
    """
    number = str(start)
    current = start
    for _ in range(n - 1):
        if not G[current]:
            current = random.randint(0, 9)  # If no valid connections, pick random digit
        else:
            current = random.choice(G[current])  # Pick from valid connections
        number += str(current)
    return number


#! ==================== VIRTUAL NUMBER MANAGEMENT ====================

@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def create_virtual_number(request):
    """Create a new virtual number with cooldown checks"""
    print("Incoming request data:", request.data)

    # Validate input parameters
    geo_code = request.data.get("geo_code", "").strip().upper()
    category = request.data.get("category", "").strip().lower()

    # Basic validation checks
    if not geo_code or not category:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    if geo_code not in GEO_CODE_LENGTHS:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    if category not in CATEGORY_CHOICES:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    
    # Check category cooldown
    allowed, error_message = CategoryCooldown.check_creation_cooldown(category, cooldown_minutes=5)
    if not allowed:
        return Response({"error": error_message}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    # Generate number based on country code
    n = GEO_CODE_LENGTHS[geo_code]
    number = generate_random_number(n=n)

    # Get available physical number
    physical_number = PhysicalNumber.objects.filter(is_active=True).first()
    if not physical_number or not physical_number.has_capacity_for_virtual_number():
        return Response(status=status.HTTP_400_BAD_REQUEST)

    # Create virtual number
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


#! ==================== NUMBER RETRIEVAL ENDPOINTS ====================

@api_view(["GET"])
@permission_classes([AllowAny])
def get_physical_numbers(request):
    """Get all active physical numbers"""
    physical_numbers = PhysicalNumber.objects.filter(is_active=True)
    serializer = PhysicalNumberSerializer(physical_numbers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def view_virtual_numbers(request):
    """Get virtual numbers, optionally filtered by category"""
    category = request.query_params.get('category')
    if category:
        virtual_numbers = VirtualNumber.objects.filter(category=category)
    else:
        virtual_numbers = VirtualNumber.objects.all()
    serializer = VirtualNumberSerializer(virtual_numbers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


#! ==================== NUMBER DELETION AND RECOVERY ====================

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_virtual_number(request, virtual_number_id):
    """
    Delete a virtual number and prepare it for potential recovery.
    Steps:
    1. Create deletion record
    2. Store recoverable copy with messages
    3. Mark category for cooldown
    4. Delete original number
    """
    try:
        virtual_number = VirtualNumber.objects.get(id=virtual_number_id)
        category = virtual_number.category

        # Create deletion record
        DeletedVirtualNumber.objects.create(
            number=virtual_number.numbers,
            category=virtual_number.category,
            physical_number=virtual_number.physical_number
        )
        
        # Clear previous recoverable data
        RecoverableVirtualNumber.objects.all().delete()

        # Store recoverable copy
        recoverable_virtual_number = RecoverableVirtualNumber.objects.create(
            number=virtual_number.numbers,
            category=virtual_number.category,
            physical_number=virtual_number.physical_number,
            is_active=virtual_number.is_active,
            is_message_active=virtual_number.is_message_active,
            is_call_active=virtual_number.is_call_active
        )

        # Store associated messages
        messages = Message.objects.filter(virtual_number=virtual_number)
        for message in messages:
            RecoverableMessage.objects.create(
                recoverable_virtual_number=recoverable_virtual_number,
                category=message.category,
                sender=message.sender,
                message_body=message.message_body,
                is_read=message.is_read,
                received_at=message.received_at,
                created_at=message.created_at
            )
        
        # Start deletion cooldown
        CategoryCooldown.mark_deletion(category)

        # Delete the original number
        virtual_number.delete()
        return Response({"message": "Virtual number deleted successfully"}, status=status.HTTP_200_OK)
    
    except VirtualNumber.DoesNotExist:
        return Response({"error": "Virtual number not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)    


@api_view(['POST',"GET"])
@permission_classes([AllowAny])
def restore_last_deleted_virtual_number(request):
    """
    Restore the most recently deleted virtual number.
    Steps:
    1. Check recovery cooldown for all categories
    2. Get last deleted number
    3. Restore number and its messages
    4. Start recovery cooldown
    5. Clean up recoverable data
    """
    try:
        # Check cooldown status for all categories
        categories = ['social-media', 'e-commerce', 'personal']
        for category in categories:
            try:
                cooldown = CategoryCooldown.objects.get(category=category)
                in_recovery_cooldown, remaining_time = cooldown.is_in_recovery_cooldown()
                if in_recovery_cooldown:
                    remaining_minutes = int(remaining_time.total_seconds() // 60)
                    remaining_seconds = int(remaining_time.total_seconds() % 60)
                    return Response(
                        {"message": f"Cannot recover number yet. Please wait {remaining_minutes}m {remaining_seconds}s."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except CategoryCooldown.DoesNotExist:
                continue

        # Get last deleted number
        last_deleted_virtual_number = RecoverableVirtualNumber.objects.first()
        if not last_deleted_virtual_number:
            return Response({"message": "No recently deleted virtual number found to restore"}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Check if number already exists
        if VirtualNumber.objects.filter(numbers=last_deleted_virtual_number.number).exists():
            return Response({"message": "Cannot restore - virtual number already exists"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        category = last_deleted_virtual_number.category
        
        # Restore the virtual number
        recovered_virtual_number = VirtualNumber.objects.create(
            numbers=last_deleted_virtual_number.number,
            category=last_deleted_virtual_number.category,
            physical_number=last_deleted_virtual_number.physical_number,
            is_active=last_deleted_virtual_number.is_active,
            is_message_active=last_deleted_virtual_number.is_message_active,
            is_call_active=last_deleted_virtual_number.is_call_active
        )

        # Restore associated messages
        recoverable_messages = RecoverableMessage.objects.filter(recoverable_virtual_number=last_deleted_virtual_number)
        message_count = recoverable_messages.count()
        
        for rec_message in recoverable_messages:
            Message.objects.create(
                virtual_number=recovered_virtual_number,
                category=rec_message.category,
                sender=rec_message.sender,
                message_body=rec_message.message_body,
                is_read=rec_message.is_read,
                received_at=rec_message.received_at,
                created_at=rec_message.created_at
            )
        
        # Start recovery cooldown
        CategoryCooldown.mark_recovery(category)
        
        # Clean up recoverable data
        RecoverableVirtualNumber.objects.all().delete()
        
        return Response({
            "message": "Virtual number restored successfully",
            "restored_number": last_deleted_virtual_number.number,
            "messages_restored": message_count
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"message": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


#! ==================== NUMBER ACTIVATION CONTROLS ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def deactivate_virtual_number(request, virtual_number_id):
    """Toggle virtual number activation status"""
    try:
        virtual_number = VirtualNumber.objects.get(id=virtual_number_id)
        virtual_number.is_active = not virtual_number.is_active
        virtual_number.save()
        status_msg = 'deactivated' if not virtual_number.is_active else 'activated'
        return Response({'message': f'Successfully {status_msg}'}, status=status.HTTP_200_OK)
    except VirtualNumber.DoesNotExist:
        return Response({'message': 'Virtual number not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def deactivate_virtual_number_message(request, virtual_number_id):
    """Toggle message reception for virtual number"""
    try:
        virtual_number = VirtualNumber.objects.get(id=virtual_number_id)
        virtual_number.is_message_active = not virtual_number.is_message_active
        virtual_number.save()
        status_msg = 'deactivated' if not virtual_number.is_message_active else 'activated'
        return Response({'message': f'Successfully Messages {status_msg}'}, status=status.HTTP_200_OK)
    except VirtualNumber.DoesNotExist:
        return Response({'message': 'Virtual number not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def deactivate_virtual_number_call(request, virtual_number_id):
    """Toggle call reception for virtual number"""
    try:
        virtual_number = VirtualNumber.objects.get(id=virtual_number_id)
        virtual_number.is_call_active = not virtual_number.is_call_active
        virtual_number.save()
        status_msg = 'deactivated' if not virtual_number.is_call_active else 'activated'
        return Response({'message': f'Successfully Call {status_msg}'}, status=status.HTTP_200_OK)
    except VirtualNumber.DoesNotExist:
        return Response({'message': 'Virtual number not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


#! ==================== MESSAGE HANDLING ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_total_notifcation_count(request):
    """Get count of unread messages"""
    try:
        total_notification = Message.objects.filter(is_read=False).count()
        if total_notification == 0:
            return Response({'message':'No new notifications'}, status=status.HTTP_200_OK)
        return Response({'total_notification':total_notification}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error':str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Map of sender names to their categories
SENDER_CATEGORIES = {
    # E-commerce senders
    'shopeasy':'e-commerce',
    'amazon': 'e-commerce',
    'flipkart': 'e-commerce',
    'ebay': 'e-commerce',
    'walmart': 'e-commerce',

    # Social media senders
    'insta': 'social-media',
    'twitter': 'social-media',
    'linkedin': 'social-media',

    # Personal senders
    '12': 'personal',
    'personal': 'personal',
    'family': 'personal',
    'friend': 'personal',
}

@api_view(['GET'])
@permission_classes([AllowAny])
def receive_message(request):
    """
    Receive and process incoming messages.
    Validates:
    1. Required parameters
    2. Virtual number exists
    3. Number is active
    4. Message reception is enabled
    """
    virtual_number = request.GET.get('virtual_number')
    sender_name = request.GET.get('sender_name')
    msg = request.GET.get('message')

    # Validate required parameters
    if not virtual_number or not msg or not sender_name:
        return Response({"message": "Both message and sender name are required"}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    try:
        virtual_number_obj = VirtualNumber.objects.get(numbers=virtual_number)
        
        # Check if message reception is enabled
        if not virtual_number_obj.is_message_active:
            return Response({"message": "Virtual number is not active for messages"}, 
                           status=status.HTTP_400_BAD_REQUEST)

        # Check if number is active
        if not virtual_number_obj.is_active:
            return Response({"message": "Virtual number is not active"}, 
                           status=status.HTTP_400_BAD_REQUEST)

        # Process and store message
        result = forward_message(virtual_number, sender_name, msg)
        
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
    except VirtualNumber.DoesNotExist:
        return Response({"message": "Virtual number not found"}, 
                        status=status.HTTP_404_NOT_FOUND)

def forward_message(virtual_number, sender_name, msg):
    """Process and store incoming message with category validation"""
    try:
        virtual_number_obj = VirtualNumber.objects.get(numbers=virtual_number)
        
        # Get sender's category
        category = SENDER_CATEGORIES.get(sender_name.lower())
        if not category:
            return {
                'success': False, 
                'message': f"Unknown sender: {sender_name}"
            }
            
        # Validate category match
        if virtual_number_obj.category != category:
            return {
                'success': False, 
                'message': f"Category mismatch: Sender category '{category}' doesn't match virtual number category '{virtual_number_obj.category}'"
            }
        
        # Store message
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

@api_view(['GET'])
@permission_classes([AllowAny])
def forward_message_to_front_end(request):
    """Retrieve messages for a specific category"""
    category = request.GET.get('category')
    if not category:
        return Response({"error": "Category parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    virtual_number = VirtualNumber.objects.filter(category=category)
    if not virtual_number.exists():
        return Response({"error": f"No active virtual numbers found for category: {category}"}, 
                        status=status.HTTP_404_NOT_FOUND)
    
    message = Message.objects.filter(virtual_number__in=virtual_number).order_by('-received_at')
    if not message:
        return Response({"message": f"No messages found for category: {category}"}, 
                        status=status.HTTP_404_NOT_FOUND)
    
    serializer = MessageSerializer(message, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])         
def read_message(request, message_id):
    """Mark a message as read"""
    try:
        message = Message.objects.get(id=message_id)
        if not message.is_read:
            message.is_read = True
            message.save()
            return Response({'message':"Message read"}, status=status.HTTP_200_OK)
        return Response({'message':"Message already read"}, status=status.HTTP_200_OK)
    except Message.DoesNotExist:
        return Response({'message':"Message not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_message(request, message_id):
    """Delete a specific message"""
    try:
        message = Message.objects.get(id=message_id)
        message.delete()
        return Response({'message':'Message deleted successfully'}, status=status.HTTP_200_OK)
    except Message.DoesNotExist:
        return Response({'message':'Message not found'}, status=status.HTTP_400_BAD_REQUEST)


#! ==================== NUMBER LOOKUP ENDPOINTS ====================

@api_view(["GET"])
@permission_classes([AllowAny])
def get_physical_number_by_virtual_number(request, virtual_number):
    """Find physical number associated with a virtual number"""
    try:
        # Check active virtual numbers
        try:
            virtual_number_obj = VirtualNumber.objects.get(numbers=virtual_number)
            physical_number = virtual_number_obj.physical_number
            serializer = PhysicalNumberSerializer(physical_number)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except VirtualNumber.DoesNotExist:
            # Check deleted virtual numbers
            try:
                deleted_virtual_number = DeletedVirtualNumber.objects.get(number=virtual_number)
                physical_number = deleted_virtual_number.physical_number
                serializer = PhysicalNumberSerializer(physical_number)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except DeletedVirtualNumber.DoesNotExist:
                return Response({"error": "Virtual number not found in active or deleted records"}, 
                               status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["GET"])    
@permission_classes([AllowAny])    
def get_virtual_number_by_physical_number(request, physical_number):
    """Find all active virtual numbers associated with a physical number"""
    try:
        physical_number = PhysicalNumber.objects.filter(is_active=True).get(id=physical_number)
        virtual_numbers = VirtualNumber.objects.filter(physical_number=physical_number, is_active=True)
        serializer = VirtualNumberSerializer(virtual_numbers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except PhysicalNumber.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


#! ==================== COOLDOWN MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def check_category_cooldowns(request):
    """
    Check and return cooldown status for all categories.
    Returns for each category:
    - Current cooldown status
    - Last deletion time
    - Last recovery time
    - Remaining cooldown time
    """
    try:
        categories = ['social-media', 'e-commerce', 'personal']
        cooldowns = {}
        
        for category in categories:
            try:
                cooldown = CategoryCooldown.objects.get(category=category)
                in_cooldown, remaining_time = cooldown.is_in_cooldown()
                in_recovery_cooldown, recovery_remaining_time = cooldown.is_in_recovery_cooldown()
                
                if in_cooldown:
                    remaining_minutes = int(remaining_time.total_seconds() // 60)
                    remaining_seconds = int(remaining_time.total_seconds() % 60)
                    status = f"In cooldown - {remaining_minutes}m {remaining_seconds}s remaining"
                else:
                    status = "Available for creation"
                
                cooldowns[category] = {
                    "in_cooldown": in_cooldown,
                    "last_deleted": cooldown.last_deleted_at.strftime("%Y-%m-%d %H:%M:%S") if cooldown.last_deleted_at else "Never",
                    "last_recovered": cooldown.last_recovered_at.strftime("%Y-%m-%d %H:%M:%S") if cooldown.last_recovered_at else "Never",
                    "status": status,
                    "recovery_cooldown": in_recovery_cooldown,
                    "recovery_remaining_time": f"{int(recovery_remaining_time.total_seconds() // 60)}m {int(recovery_remaining_time.total_seconds() % 60)}s" if in_recovery_cooldown else None
                }
            except CategoryCooldown.DoesNotExist:
                cooldowns[category] = {
                    "in_cooldown": False,
                    "last_deleted": "Never",
                    "last_recovered": "Never",
                    "status": "Available for creation",
                    "recovery_cooldown": False,
                    "recovery_remaining_time": None
                }
        
        return Response(cooldowns)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )