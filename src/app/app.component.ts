import {Component, OnInit} from '@angular/core';
import firebase from 'firebase';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';

const firebaseConfig = {
  apiKey: 'AIzaSyDwjshhigw6qqA-kd03GS0DNqLl8bUoVLI',
  authDomain: 'espy-fc7e1.firebaseapp.com',
  projectId: 'espy-fc7e1',
  storageBucket: 'espy-fc7e1.appspot.com',
  messagingSenderId: '84247213513',
  appId: '1:84247213513:web:53f4c79151d1e01763e418',
  measurementId: 'G-7NR49FEXB7'
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  loginForm: FormGroup;
  registerForm: FormGroup;
  loginPhone: FormGroup;
  baseUrl = 'http://localhost:3001';
  token = '';
  windowRef: any;
  windowRef2: any;
  verificationCode: string;
  user: any;

  constructor(private http: HttpClient) {
    firebase.initializeApp(firebaseConfig);
  }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      password: new FormControl('', [
        Validators.required,
      ]),
    });
    this.registerForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      password: new FormControl('', [
        Validators.required,
      ]),
    });

    this.loginPhone = new FormGroup({
      phone: new FormControl('', [Validators.required]),
    });
    this.windowRef = window;
    this.windowRef.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
    this.windowRef.recaptchaVerifier.render();

    this.windowRef2 = window;
    this.windowRef2.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container2');
    this.windowRef2.recaptchaVerifier.render();
  }

  login(): void {
    const {email, password} = this.loginForm.value;
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(({user}) => {
        this.http.post(this.baseUrl + '/users/session', {uid: user.uid})
          .toPromise().then((result) => console.log(result)).catch((error) => console.log(error));
        user.getIdToken().then((idToken) => {
          this.token = idToken;
          console.log(idToken);
        });
      });
  }

  registerSubmit(): void {
    const {email, password} = this.registerForm.value;
    this.http.post(this.baseUrl + '/users', {email, password})
      .toPromise()
      .then((result) => {
        console.log(result);
        firebase.auth().signInWithEmailAndPassword(email, password)
          .then((resultUser) => {
            resultUser.user.sendEmailVerification().then(() => {
              console.log('Send Email verify');
            }).catch((errorEmail) => console.log(errorEmail));
          });
      }).catch((err) => console.log(err));
  }

  sendLoginCode(): void {

    const appVerifier = this.windowRef.recaptchaVerifier;

    const {phone} = this.loginPhone.value;

    firebase.auth().signInWithPhoneNumber(phone, appVerifier)
      .then(result => {

        this.windowRef.confirmationResult = result;

      })
      .catch(error => console.log(error));

  }

  verifyLoginCode(): void {
    this.windowRef.confirmationResult
      .confirm(this.verificationCode)
      .then(({user}) => {
        this.user = user;
        this.http.post(this.baseUrl + '/users/login', {
          email: user.email,
          uid: user.uid,
          phone: user.phoneNumber,
          avatar: user.photoURL,
          signInProvider: user.providerData[0].providerId
        }).toPromise().then((result) => {
          console.log(result);
          user.getIdToken().then((idToken) => {
            this.token = idToken;
          }).catch((error) => console.log(error));
        }).catch(error => console.log(error));
      }).catch(error => console.log(error, 'Incorrect code entered?'));
  }

  google(): Promise<void> {
    return this.AuthLogin(new firebase.auth.GoogleAuthProvider());
  }

  AuthLogin(provider): Promise<void> {
    return firebase.auth().signInWithPopup(provider)
      .then(({user}) => {
        console.log(user);
        this.http.post(this.baseUrl + '/users/login', {
          email: user.email,
          uid: user.uid,
          phone: user.phoneNumber,
          avatar: user.photoURL,
          signInProvider: user.providerData[0].providerId
        }).toPromise().then((resultResponse) => {
          console.log(resultResponse);
          user?.getIdToken().then((idToken) => {
            this.http.post(this.baseUrl + '/users/session', {uid: user.uid})
              .toPromise().then((result) => console.log(result)).catch((error) => console.log(error));
            this.token = idToken;
            console.log(idToken);
          });
        }).catch((error) => console.log(error));
        console.log('You have been successfully logged in!');
      }).catch((error) => {
        console.log(error);
      });
  }

  microsoft(): Promise<void> {
    return this.AuthLogin(new firebase.auth.OAuthProvider('microsoft.com'));
  }

  facebook(): Promise<void> {
    return this.AuthLogin(new firebase.auth.FacebookAuthProvider());
  }

  getAllUser(): void {
    this.http.get(this.baseUrl + '/users/profile', {
      headers: {
        Authorization: 'Bearer' + ` ${this.token}`
      }
    })
      .subscribe((result) => console.log(result));
  }

  async reset(): Promise<void> {
    try {
      await firebase.auth().sendPasswordResetEmail('misiraskerov1@gmail.com');
      console.log('reset email');
    } catch (e) {
      console.log(e);
    }
  }

  async changeEmail(): Promise<void> {
    try {
      await firebase.auth().currentUser.updateEmail('misirua@code.edu.az');
    }catch (e) {
      console.log(e);
    }
  }

  async changePhone(): Promise<void> {
    try {
      const appVerifier = this.windowRef2.recaptchaVerifier;
      const id = await new firebase.auth.PhoneAuthProvider()
        .verifyPhoneNumber('+994505041246', appVerifier);
      const code = window.prompt('Bitte zugeschickten Code eingeben');
      const cred = firebase.auth.PhoneAuthProvider.credential(id, code);
      await firebase.auth().currentUser.updatePhoneNumber(cred);
      console.log('phone number changed', id, cred, firebase.auth().currentUser);
    }catch (e) {
      console.log(e);
    }
  }
}
