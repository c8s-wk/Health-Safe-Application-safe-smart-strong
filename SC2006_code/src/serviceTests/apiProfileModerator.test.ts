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

const moderator:Account={
    email: "moderate1@gmail.com",
    password: "123456",
    userId: "bbab88fe-71e0-43f8-96a2-d143ca64aa7f",
    type: "MODERATOR"
}

const normal:Account={
    email: "normal1@gmail.com",
    password: "123456",
    userId: "d6db9e8a-bfa3-4b23-a651-3fc274eed8f0",
    type: "NORMAL"
}
const admin:Account={
    email: "admin1@gmail.com",
    password: "123456",
    userId: "fbf25c0f-03b3-4a84-a3a7-8326fc1c2cd5",
    type: "ADMIN"
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



describe.sequential('apiProfile moderator', async () => {

beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore=useUserStore();
    await userStore.initUser();
    await userStore.logoutUser();
    await userStore.loginUser(moderator.email, moderator.password);
    if (!userStore.user) throw new Error('User not logged in');
});


test('moderator can only change type between normal and restricted', async () => {
    expect(await testChangeType(normal, "RESTRICTED")).toBe(true);
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