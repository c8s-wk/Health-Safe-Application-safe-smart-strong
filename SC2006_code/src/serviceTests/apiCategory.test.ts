import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '../stores/userStore';
import { beforeEach, test, expect, describe } from 'vitest';
import { Category, createCategory, getCategories, searchCategories } from '../services/apiCategory';


let categoryCount:number;
let newCategoryName:string="Test Category";

async function login() {
    const userStore=useUserStore();
    await userStore.initUser();
    await userStore.loginUser("normal4@gmail.com","123456");
    if (!userStore.user) throw new Error('User not logged in');
}


describe.sequential('apiCategory', async () => {

beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    await login();
});

test('get catogeries', async () => {
    const categories:Category[]=await getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(0);
    categoryCount=categories.length;
});

test('create category', async () => {
    expect(async()=>{await createCategory(newCategoryName);}).not.toThrow();
});

test('get catogeries again', async () => {
    const categories:Category[]=await getCategories();
    expect(categories.length).toBe(categoryCount+1);
    categoryCount=categories.length;
});

test('search categories', async () => {
    const categories:Category[]=await searchCategories("Category");
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].name).toBe(newCategoryName);
    expect(categories[0].id).toBeGreaterThan(0);
    expect(categories[0].created_at).not.toBeNull();
});

});
