from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Application
from .serializers import ApplicationSerializer

class ApplicationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        queryset = Application.objects.filter(user=self.request.user).select_related('job', 'resume')
        status_param = self.request.query_params.get('status', '').strip()
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user).select_related('job', 'resume')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
