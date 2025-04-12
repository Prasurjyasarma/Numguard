from django.urls import path
from .views import view_virtual_numbers,get_physical_numbers,create_virtual_number,delete_virtual_number,forward_message_to_front_end,receive_message,delete_message
urlpatterns = [
    path('physical-numbers/',get_physical_numbers,name='get_physical_numbers'),
    path('create-virtual-number/',create_virtual_number,name='create_virtual_number'),
    path('virtual-numbers/',view_virtual_numbers,name='view_virtual_numbers'),
    path('delete-virtual-number/<int:virtual_number_id>/',delete_virtual_number,name='delete_virtual_number'),
    path('forward-message/',forward_message_to_front_end,name='forward_message_to_front_end'),
    path('receive-message/',receive_message,name='receive_message'),
    path('delete-message/<int:message_id>/',delete_message,name='delete_message')

]
