import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { FileMetadataDto, Placeholder, PlaceholderDto } from './models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  baseUrl = 'http://localhost:5292';
  placholderUrl = this.baseUrl + '/placeholder';
  
  fileMetadataArray : FileMetadataDto[] = [];
  placeholderArray : Placeholder[] = [];
  remoteValueArray : string[] = [];

  tempPlaceholderKey = signal("")
  tempPlaceholderValue = signal("")

  title = 'TdoTAdminPanel';
  password = 'test'

  async encryptedPassword() {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

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
        this.fillRemotePlaceholders();
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

  async fillRemotePlaceholders() {
    //reset the placeholderArray and remoteValueArray
    this.placeholderArray = [];
    this.remoteValueArray = [];


    fetch(this.placholderUrl, {
      method: 'GET',
      headers: {
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
      console.log("Final Placeholder fetch:" + JSON.stringify(data));
      if (data != null) {
        const newPlaceholderArray = data;
        //fill the placeholderArray with the newPlaceholderArray. Assume that placeholderArray is empty
        newPlaceholderArray.forEach((placeholderDto: PlaceholderDto) => {
          const placeholder: Placeholder = {
            key: placeholderDto.key,
            value: placeholderDto.value,
            savedRemotely: true
          }
          this.placeholderArray.push(placeholder);
          this.remoteValueArray.push(placeholderDto.value);
        });
      }
      console.log(this.placeholderArray)
    })
  }

  placeholderValueChanged(index : number){
    //check in the remoteValueArray if the value has changed
    console.log("Checking if value has changed");
    console.log("Actual:" + this.placeholderArray[index].value);
    console.log("Remote:" + this.remoteValueArray[index]);

    if(this.placeholderArray[index].value !== this.remoteValueArray[index]){
      this.placeholderArray[index].savedRemotely = false;
    }
    else{
      this.placeholderArray[index].savedRemotely = true;
    }
  }

  addPlaceholder() {
    const newPlaceholder: Placeholder = {
      key: this.tempPlaceholderKey(),
      value: this.tempPlaceholderValue(),
      savedRemotely: false
    }

    //check if the key is in use
    let keyInUse = false;
    this.placeholderArray.forEach((placeholder: Placeholder) => {
      if (placeholder.key === newPlaceholder.key) {
        keyInUse = true;
      }
    });
    if(!keyInUse){
      this.placeholderArray.push(newPlaceholder);
      this.tempPlaceholderKey.set("");
      this.tempPlaceholderValue.set("");
    }else{
      alert('Key already in use');
    }
    
  }

  async savePlaceholderChanges() {
    //put onto the placeholder endpoint
    const newPlaceholderArray: PlaceholderDto[] = [];
    this.placeholderArray.forEach((placeholder: Placeholder) => {
      const placeholderDto: PlaceholderDto = {
        key: placeholder.key,
        value: placeholder.value
      }
      newPlaceholderArray.push(placeholderDto);
    });
    console.log("Final Placeholder save:" + JSON.stringify(newPlaceholderArray));

    fetch(this.placholderUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'password': await this.encryptedPassword()
      },
      body: JSON.stringify(newPlaceholderArray)
    }).then(response => {
      console.log(response);
      this.fillRemotePlaceholders();
      if (response.status === 200) {
        return response;
      }
      else {
        console.log('error');
        return null;
      }
    })
  }

  discardPlaceholderChanges() {
    this.fillRemotePlaceholders();
  }

  removePlaceholder(index : number){
    this.placeholderArray.splice(index, 1);
  }
}
