import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebService {

  private apiUrl = `${environment.apiURL}/api`;

  constructor(private http: HttpClient) { }

  // ----- Auth -----
  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, data);
  }

  sendOTP(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/sendOTP`, data);
  }

  verifyOTP(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verifyOTP`, data);
  }

  googleLogin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/google-login`);
  }

  facebookLogin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/facebook-login`);
  }


   // ---------- User APIs ----------

  // Get a specific user by ID
  getUserById(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/user`);
  }

  // Get all users (maybe admin usage)
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  // Update user profile
  updateUser(userId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}`, data);
  }

  // Delete a user (careful with this!)
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  // ----- Quizzes -----
  createQuiz(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/quizzes/create`, data);
  }

  getQuizzes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/quizzes`);
  }

  getQuizById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/quizzes/${id}`);
  }

  deleteQuiz(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/quizzes/${id}`);
  }

  // ----- Questions -----
  createQuestion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/questions/create`, data);
  }

  getQuestions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/questions`);
  }

  getQuestionById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/questions/${id}`);
  }

  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${id}`);
  }

  // ----- Attempts -----
  attemptQuiz(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/attempts/attempt`, data);
  }

  getUserAttempts(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/attempts/user/${userId}`);
  }

  getAttemptById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/attempts/${id}`);
  }

  // ----- Rewards -----
  createReward(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rewards/create`, data);
  }

  redeemReward(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rewards/redeem`, data);
  }

  addReward(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rewards/add`, data);
  }

  shareReward(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rewards/share`, data);
  }

  getUserRewards(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/rewards/${id}`);
  }

  // ----- Wallet -----
  addRewardToWallet(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/wallet/add-reward`, data);
  }

  withdrawFunds(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/wallet/withdraw`, data);
  }

  // ----- Payments -----
  createOrder(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/create-order`, data);
  }

  verifyPayment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/verify-payment`, data);
  }

  getUserTransactions(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/transactions/${userId}`);
  }
}
