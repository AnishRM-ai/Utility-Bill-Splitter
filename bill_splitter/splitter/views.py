from rest_framework import viewsets, generics
from .models import Bill, Split
from django.contrib.auth.models import User
from .serializers import BillSerializer, SplitSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
class BillViewSet(viewsets.ModelViewSet):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        bill = serializer.save(paid_by=self.request.user)
        users = User.objects.exclude(id=self.request.user.id)  # Exclude payer
        split_amount = bill.amount / (users.count() + 1)  # Equal split

        for user in users:
            Split.objects.create(
                bill=bill,
                user=user,
                amount_owed=split_amount,
                is_paid=False
            )

class SplitViewSet(viewsets.ModelViewSet):
    queryset = Split.objects.all()
    serializer_class = SplitSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_debts(self, request):
        debts = Split.objects.filter(user=request.user, is_paid=False)
        serializer = self.get_serializer(debts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def settle(self, request, pk=None):
        split = self.get_object()
        split.is_paid = True
        split.save()
        return Response({'status': 'debt settled'})
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny] #allow anyone to register.add()
    
    