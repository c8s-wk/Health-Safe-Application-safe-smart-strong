import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '../stores/userStore';
import { beforeEach, test, expect, describe } from 'vitest';
import { Alert, CreateAlert, createAlert, getAlerts, getLatestAlert, subscribeToAlerts, unsubscribeFromAlerts } from '../services/apiAlert';

let userId:string;
const newAlert:CreateAlert={
    content: "Test alert",
    category_id: 3,
    longitude: 103.871955871582,
    latitude: 1.35084987098825,
}


describe.sequential('apiAlert', async () => {

beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore=useUserStore();
    await userStore.initUser();
    await userStore.loginUser("admin1@gmail.com","123456");
    if (!userStore.user) throw new Error('User not logged in');
    userId=userStore.user.id;
});

test('create alert', async () => {
    expect(async ()=>{
        await createAlert(newAlert);
    }).not.toThrow();
});

test('get alerts', async () => {
    const alerts:Alert[]=await getAlerts();
    expect(alerts.length).toBeGreaterThan(0);
});

test('get latest alert', async () => {
    const latestAlert:Alert|null=await getLatestAlert();
    expect(latestAlert).not.toBeNull();
    if (latestAlert) {
        expect(latestAlert.user_id).toBe(userId);
        expect(latestAlert.content).toBe(newAlert.content);
        expect(latestAlert.longitude).toBe(newAlert.longitude);
        expect(latestAlert.latitude).toBe(newAlert.latitude);
        expect(latestAlert.category_id).toBe(newAlert.category_id); 
    }
})

test('subscribe to alerts', async () => {
    // Setup: Create a Promise to track the callback
    let callbackCalled = false;
    const promise = new Promise((resolve) => {
        const callback = () => {
            callbackCalled = true;
            resolve(true);
        };
      
        // Set up the subscription
        const subscription = subscribeToAlerts(callback);
        
        // Automatically unsubscribe when the test ends
        return () => unsubscribeFromAlerts(subscription);
    });
  
    // Trigger a real insert operation
    await createAlert(newAlert);
  
    // Set a maximum wait of 3 seconds (real-time subscriptions may have delays)
    await Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);
  
    // Verify the callback was invoked
    expect(callbackCalled).toBe(true);
}, 10000); // Set test timeout to 5 seconds

})