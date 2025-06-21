import { defineStore } from 'pinia';
import { ref } from 'vue';
import { LoginResponse, register, login, retrieveUser, logout, updateAuth, resetPassword } from '../services/apiUserAuth.ts';
import { User, UserAttributes } from '@supabase/supabase-js';

export const useUserStore = defineStore('user', () => {
    // Reactive reference to store the current user
    const user = ref<User|null>(null);
    // Reactive reference to indicate if an operation is in progress
    const isLoading = ref(false);
    // Reactive reference to store any error messages
    const error = ref<string | null>(null);

    const registerUser = async (email: string, password: string) => {
        isLoading.value = true;
        error.value = null;
        try {
            await register(email, password);
            // Since the user needs to verify email, we don't set user data here yet
        } catch (err) {
            if (err instanceof Error) {
                error.value = err.message;
            }
        } finally {
            isLoading.value = false;
        }
    };

    const loginUser = async (email: string, password: string) => {
        isLoading.value = true;
        error.value = null;
        try {
            const data:LoginResponse= await login(email, password);
            user.value = data.user;
            localStorage.setItem('user', JSON.stringify(user.value));
        } catch (err) {
            if (err instanceof Error) {
                error.value = err.message;
            }
        } finally {
            isLoading.value = false;
        }
    };

    const logoutUser = async () => {
        isLoading.value = true;
        error.value = null;
        try {
            await logout();
            user.value = null;
            localStorage.removeItem('user');
        } catch (err) {
            if (err instanceof Error) {
                error.value = err.message;
            }
        } finally {
            isLoading.value = false;
        }
    };

    const resetUserPassword = async (email: string) => {
        isLoading.value = true;
        error.value = null;
        try {
            await resetPassword(email);
        } catch (err) {
            if (err instanceof Error) {
                error.value = err.message;
            }
        } finally {
            isLoading.value = false;
        }
    };

    const updateUserAccount = async (updates: UserAttributes) => {
        isLoading.value = true;
        error.value = null;
        try {
            const data:User = await updateAuth(updates);
            user.value = data;
            localStorage.setItem('user', JSON.stringify(user.value));
        } catch (err) {
            if (err instanceof Error) {
                error.value = err.message;
            }
        } finally {
            isLoading.value = false;
        }
    };

    const initUser = async () => {
        isLoading.value = true;
        error.value = null;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const currentUser:User|null = await retrieveUser();
                if (currentUser && currentUser.id === parsedUser.id) {
                    user.value = currentUser;
                } else {
                    localStorage.removeItem('user');
                }
            } catch (err) {
                if (err instanceof Error) {
                    error.value = err.message;
                }
            }
        }
        isLoading.value = false;
    };

    return {
        user,
        isLoading,
        error,
        registerUser,
        loginUser,
        logoutUser,
        resetUserPassword,
        updateUserAccount,
        initUser
    };
});