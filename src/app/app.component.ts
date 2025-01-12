import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { FileMetadataDto } from './models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  baseUrl = 'http://localhost:5292';
  
  fileMetadataArray : FileMetadataDto[] = [];

  title = 'TdoTAdminPanel';
  password = 'test'

  encryptedPassword = computed(() => {
    //encrypt password using sha256
    const msgBuffer = new TextEncoder().encode(this.password);
    return crypto.subtle.digest('SHA-256', msgBuffer).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    });
  });
  async onSubmit() {
    console.log(this.password);
   
    console.log(await this.encryptedPassword() + "1")
    fetch(this.baseUrl + '/files', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'password': await this.encryptedPassword()
      },
    }).then(response => {
      console.log(response);
      if (response.status === 200) {
        return response.json();
      }
      else {
        console.log('error');
        return null;
      }
    }).then(data => {
      console.log(data);
      if (data != null) {
        this.fileMetadataArray = data;
      }
      console.log(this.fileMetadataArray)
    })
  }

  async downloadFile(getUrl : string, fileName : string){
    console.log(getUrl);

    

    fetch(this.baseUrl + getUrl, {
      method: 'GET',
      headers: {
        'password': await this.encryptedPassword()
      },
    }).then(response => {
      console.log(response);
      if (response.status === 200) {
        return response.blob();
      }
      else {
        console.log('error');
        return null;
      }
    }).then(blob => {
      console.log(blob);
      if (blob != null) {
        

        if (blob.type === 'application/json') {
          blob.text().then(text => {
            const json = JSON.parse(text);
            const jsonBlob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(jsonBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
        } else {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        
      }
    })

    
  }

  async uploadFile(postUrl : string){
    console.log(postUrl);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.click()
    fileInput.onchange = async () => {
      if (!fileInput.files) {
        console.log('No file selected');
        return;
      }
      const file = fileInput.files[0];
      console.log(file);

      const formData = new FormData();
      formData.append('file', file);

      fetch(this.baseUrl + postUrl, {
        method: 'POST',
        headers: {
          'password': await this.encryptedPassword()
        },
        body: formData
      }).then(response => {
        console.log(response);
        if (response.status === 200) {
          return response;
          alert('File uploaded successfully');
        }
        else {
          console.log('error');
          return null;
        }
      })
    }

  }
}
