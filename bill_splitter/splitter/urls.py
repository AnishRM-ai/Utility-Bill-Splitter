from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillViewSet, SplitViewSet, RegisterView

router = DefaultRouter()
router.register(r'bills', BillViewSet)
router.register(r'splits', SplitViewSet, basename='split')


urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    
]