from django.urls import path
from .views import (
    get_physical_numbers,
    create_virtual_number,
    view_virtual_numbers,
    delete_virtual_number,
    forward_message_to_front_end,
    receive_message,
    delete_message,
    get_total_notifcation_count,
    read_message,
    get_physical_number_by_virtual_number,
    deactivate_virtual_number,
    deactivate_virtual_number_message,
    restore_last_deleted_virtual_number,
    deactivate_virtual_number_call,
    check_category_cooldowns
)

urlpatterns = [
    #! Physical & Virtual Number Management
    path('physical-numbers/', get_physical_numbers, name='get_physical_numbers'),
    path('create-virtual-number/', create_virtual_number, name='create_virtual_number'),
    path('virtual-numbers/', view_virtual_numbers, name='view_virtual_numbers'),
    path('delete-virtual-number/<int:virtual_number_id>/', delete_virtual_number, name='delete_virtual_number'),
    path('deactivate-virtual-number/<int:virtual_number_id>/',deactivate_virtual_number,name='deactivate_virtual_number'),
    path('deactivate-virtual-number-message/<int:virtual_number_id>/',deactivate_virtual_number_message,name='deactivate_virtual_number_message'),
    path('deactivate-virtual-number-call/<int:virtual_number_id>/',deactivate_virtual_number_call,name='deactivate_virtual_number_call'),
    path('restore-last-deleted-virtual-number/',restore_last_deleted_virtual_number,name='restore_last_deleted_virtual_number'),
    path('check-category-cooldowns/',check_category_cooldowns,name='check_category_cooldowns'),


    #! Message Handling
    path('forward-message/', forward_message_to_front_end, name='forward_message_to_front_end'),
    path('receive-message/', receive_message, name='receive_message'),
    path('delete-message/<int:message_id>/', delete_message, name='delete_message'),
    path('read-message/<int:message_id>/',read_message,name='read_message'),

    #! Notification
    path('total-notification/',get_total_notifcation_count, name='get_total_notifaction_count'),

    #! Get Physical Number by virtual number
    path('get-physical-number-by-virtual-number/<str:virtual_number>/',get_physical_number_by_virtual_number, name='get_physical_number_by_virtual_number'),
]
