from django.urls import path
from .views import view_virtual_numbers

urlpatterns = [
    path('virtual-numbers/',view_virtual_numbers,name='view_virtual_numbers')
]
