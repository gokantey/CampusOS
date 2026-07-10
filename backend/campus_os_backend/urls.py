"""
URL configuration for campus_os_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import custom auth and sync views
from campus_users.views import CustomObtainAuthToken, UserMeView, UserViewSet
from campus_sync.views import SyncPushView, SyncPullView


# Import ViewSets
from campus_core.views import (
    SchoolViewSet, AcademicYearViewSet, AcademicTermViewSet,
    ClassLevelViewSet, SectionViewSet, SubjectViewSet, GradingSystemViewSet, SyllabusTopicViewSet
)
from campus_students.views import (
    StudentViewSet, EnrollmentViewSet, AcademicRecordViewSet, AttendanceViewSet
)
from campus_finance.views import (
    FeeCategoryViewSet, FeeStructureViewSet,
    StudentAccountViewSet, PaymentReceiptViewSet
)
from campus_assets.views import AssetViewSet

# Initialize DefaultRouter
router = DefaultRouter()

# Users
router.register(r'users', UserViewSet, basename='user')

# Core School Structure
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'academic-terms', AcademicTermViewSet, basename='academic-term')
router.register(r'class-levels', ClassLevelViewSet, basename='class-level')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'grading-systems', GradingSystemViewSet, basename='grading-system')
router.register(r'syllabus-topics', SyllabusTopicViewSet, basename='syllabus-topic')

# Students
router.register(r'students', StudentViewSet, basename='student')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'academic-records', AcademicRecordViewSet, basename='academic-record')
router.register(r'attendance', AttendanceViewSet, basename='attendance')

# Finance
router.register(r'fee-categories', FeeCategoryViewSet, basename='fee-category')
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'student-accounts', StudentAccountViewSet, basename='student-account')
router.register(r'payment-receipts', PaymentReceiptViewSet, basename='payment-receipt')

# Assets
router.register(r'assets', AssetViewSet, basename='asset')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include(router.urls)),
    path('api/auth/login/', CustomObtainAuthToken.as_view(), name='api-login'),
    path('api/auth/me/', UserMeView.as_view(), name='api-me'),
    path('api/sync/push/', SyncPushView.as_view(), name='sync-push'),
    path('api/sync/pull/', SyncPullView.as_view(), name='sync-pull'),
]

