import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '../stores/userStore';
import { beforeEach, test, expect, describe, afterEach } from 'vitest';
import { Profile, UpdateProfile, getProfileByUserId, getProfile, updateProfile, deleteProfile, searchProfileByName, changeUserTypeByUserId } from '../services/apiProfile';

let userId:string;
let profileNameInit:string;
const profileNameNew:string="NORMAL Hu Han";




describe.sequential('apiProfile', async () => {

beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore=useUserStore();
    await userStore.initUser();
    await userStore.loginUser("normal3@gmail.com","123456");
    if (!userStore.user) throw new Error('User not logged in');
    userId=userStore.user.id;
});

// afterEach(async () => {
//     await logout();
// });



test('delete profile', async () => {
    await expect(deleteProfile()).resolves.not.toThrow();
});

test('get no profile and create one', async () => {
    profileNameInit="User_"+userId;
    const profile:Profile=await getProfile();
    expect(profile.user_id).toBe(userId);
    expect(profile.name).toBe(profileNameInit);
});

test('update profile with boundary values', async () => {
    let longName="";
    for(let i=0;i<256;i++){
        longName+="a";
    }
    const updates:UpdateProfile={
        name: longName
    }
    await expect(updateProfile(updates)).rejects.toThrow();
    await expect(updateProfile({})).rejects.toThrow();
});

test('update profile', async () => {
    const updates:UpdateProfile={
        name:profileNameNew
    }
    await updateProfile(updates);
    const profile:Profile=await getProfile();
    expect(profile.user_id).toBe(userId);
    expect(profile.name).toBe(profileNameNew);
});

test('search profile by name', async () => {
    const profiles:Profile[]=await searchProfileByName("Hu");
    expect(profiles.length).toBeGreaterThan(0);
});
});