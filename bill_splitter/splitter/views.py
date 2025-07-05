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
        # Calculate equal split (including payer in count)
        total_users = users.count() + 1
        split_amount = bill.amount / total_users

        for user in users:
            Split.objects.create(
                bill=bill,
                user=user,
                amount_owed=split_amount,
                is_paid=False
            )
        # Create a "paid" record for the payer
        Split.objects.create(
            bill=bill,
            user=self.request.user,
            amount_owed=bill.amount,  # Full amount
            is_paid=True  # Automatically marked as paid
        )

class SplitViewSet(viewsets.ModelViewSet):
    queryset = Split.objects.all()
    serializer_class = SplitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only show splits related to the current user
        return self.queryset.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_debts(self, request):
        debts = Split.objects.filter(user=request.user, is_paid=False).exclude(bill__paid_by=request.user)
        serializer = self.get_serializer(debts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def settle(self, request, pk=None):
        split = self.get_object()
        if split.user != request.user:
            return Response(
                {'error': 'You can only settle your own debts'},
                status=403
            )
        split.is_paid = True
        split.save()
        return Response({
            'status': 'debt settled',
            'amount_owed': split.amount_owed,
            'bill_title': split.bill.title
        })
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny] #allow anyone to register.add()
    
    