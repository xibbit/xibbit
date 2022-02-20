import json
from django.http import HttpResponse
from django.shortcuts import render
from .forms import UploadFileForm

def upload_file(request):
  if request.method != 'POST':
    form = UploadFileForm()
  else:
    form = UploadFileForm(request.POST, request.FILES)
    if form.is_valid():
      from app.app import hub

      session = hub.getSessionByInstance(request.POST.get('instance',''))
      eventReply = hub.trigger({
        'type': 'user_profile_upload_photo',
        'image': {
          'tmp_name': request.FILES['user_profile_upload_photo_image']
        },
        '_session': session['session_data']
      })
      eventReply['image'] = 'image'
      del eventReply['_session']
      return HttpResponse(json.dumps(eventReply), content_type='text/plain')
  return render(request, 'upload.html', {'form': form})
