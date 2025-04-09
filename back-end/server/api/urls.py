from django.urls import path
from .views import view_virtual_numbers,get_physical_numbers,create_virtual_number

urlpatterns = [
    path('physical-numbers/',get_physical_numbers,name='get_physical_numbers'),
    path('create-virtual-number/',create_virtual_number,name='create_virtual_number'),
    path('virtual-numbers/',view_virtual_numbers,name='view_virtual_numbers')
]
