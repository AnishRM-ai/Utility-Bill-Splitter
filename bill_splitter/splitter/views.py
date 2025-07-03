from rest_framework import viewsets, generics
from .models import Bill, Split
from django.contrib.auth.models import User
from .serializers import BillSerializer, SplitSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UserSerializer
class BillViewSet(viewsets.ModelViewSet):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(paid_by=self.request.user)

class SplitViewSet(viewsets.ModelViewSet):
    queryset = Split.objects.all()
    serializer_class = SplitSerializer
    permission_classes = [IsAuthenticated]
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny] #allow anyone to register.add()
    
    