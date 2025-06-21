import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '../stores/userStore';
import { beforeEach, test, expect, describe, afterEach } from 'vitest';
import { Profile, UpdateProfile, getProfileByUserId, getProfile, updateProfile, deleteProfile, searchProfileByName, changeUserTypeByUserId } from '../services/apiProfile';

let userId:string;
let profileNameInit:string;
const profileNameNew:string="NORMAL Hu Han";


interface Account {
    email: string;
    password: string;
    userId: string;
    type: string;
}
 
const normal:Account={
    email: "normal3@gmail.com",
    password: "123456",
    userId: "5d8ada72-d5c9-4a2e-be2f-84b63617f05b",
    type: "NORMAL"
}
const admin:Account={
    email: "admin2@gmail.com",
    password: "123456",
    userId: "5e65bc33-2615-40fb-9e26-b3cb1f9772bc",
    type: "ADMIN"
}
const moderator:Account={
    email: "moderate1@gmail.com",
    password: "123456",
    userId: "cbf20b41-4093-4e3c-9fe9-516c0ef9be61",
    type: "MODERATOR"
}

async function testChangeType(targetAccount:Account, newType:string):Promise<boolean> {
    try {
        await changeUserTypeByUserId(targetAccount.userId, newType);
        const profile:Profile=await getProfileByUserId(targetAccount.userId);
        await changeUserTypeByUserId(targetAccount.userId, targetAccount.type);
        return profile.type===newType;
    } catch (error) {
        return false;
    }
}



describe.sequential('apiProfile normal', async () => {

beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore=useUserStore();
    await userStore.initUser();
    await userStore.logoutUser();
    await userStore.loginUser(normal.email, normal.password);
    if (!userStore.user) throw new Error('User not logged in');
});


test('NORMAL cannot change type', async () => {
    expect(await testChangeType(normal, "RESTRICTED")).toBe(false);
    expect(await testChangeType(normal, "MODERATOR")).toBe(false);
    expect(await testChangeType(normal, "ADMIN")).toBe(false);

    expect(await testChangeType(moderator, "NORMAL")).toBe(false);
    expect(await testChangeType(moderator, "RESTRICTED")).toBe(false);
    expect(await testChangeType(moderator, "ADMIN")).toBe(false);

    expect(await testChangeType(admin, "NORMAL")).toBe(false);
    expect(await testChangeType(admin, "RESTRICTED")).toBe(false);
    expect(await testChangeType(admin, "MODERATOR")).toBe(false);
}, 10000);

});