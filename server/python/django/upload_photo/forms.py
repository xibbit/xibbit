from django import forms

class UploadFileForm(forms.Form):
  user_profile_upload_photo_image = forms.FileField()
