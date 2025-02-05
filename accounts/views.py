from django.shortcuts import render
from django.contrib.auth import authenticate, login
# from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import redirect
from django.http import HttpResponse
from .forms import RegisterForm

# Create your views here.
def loginview(request):
    if request.method == 'POST':
        user = authenticate(request, username=request.POST["username"],
                            password=request.POST["password"])
        if user:
            login(request, user)
            return redirect('chat_page')
        else:
            return HttpResponse('Invalid credentials', status=401)

    return render(request, 'accounts/login.html')

def register_view(request):
    form = RegisterForm(request.POST or None)
    if form.is_valid():
        form.save()
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password1')
        user = authenticate(request, username=username, password=password)
        login(request, user)
        return redirect('chat_page')
    return render(request, 'accounts/register.html', {'form': form})
