import React, { createContext, useContext, useEffect, useState } from 'react';
import { restaurantAuthAPI } from '../services/api';

const RestaurantAuthContext = createContext(null);

export const RestaurantAuthProvider = ({ children }) => {
	const [isRestaurantLoggedIn, setIsRestaurantLoggedIn] = useState(false);
	const [restaurantUser, setRestaurantUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		try {
			const token = localStorage.getItem('restaurantToken');
			const dataRaw = localStorage.getItem('restaurantData');
			const data = dataRaw ? JSON.parse(dataRaw) : null;
			if (token && data) {
				setIsRestaurantLoggedIn(true);
				setRestaurantUser(data);
			}
		} catch (e) {
			console.warn('Failed to restore restaurant session', e);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const login = async (credentials) => {
		setError(null);
		const res = await restaurantAuthAPI.login(credentials);
		if (res.success) {
			if (res.data?.requiresApproval) {
				// Handle pending approval case
				setIsRestaurantLoggedIn(false);
				setRestaurantUser(null);
				setError('Account is pending approval. You will be notified once approved.');
			} else if (res.data?.token) {
				// Normal successful login
				setIsRestaurantLoggedIn(true);
				setError(null);
			} else {
				// Login failed
				setIsRestaurantLoggedIn(false);
				setRestaurantUser(null);
				setError(res.message || 'Login failed');
			}
		} else {
			setIsRestaurantLoggedIn(false);
			setRestaurantUser(null);
			setError(res.message || 'Login failed');
		}
		return res;
	};

	const logout = async () => {
		try { await restaurantAuthAPI.logout(); } catch {}
		setIsRestaurantLoggedIn(false);
		setRestaurantUser(null);
	};

	const updateRestaurantUser = (updatedUser) => {
		setRestaurantUser(updatedUser);
		localStorage.setItem('restaurantData', JSON.stringify(updatedUser));
	};

	const refreshRestaurantData = async () => {
		try {
			const response = await restaurantAuthAPI.getRestaurantProfile();
			if (response.success) {
				setRestaurantUser(response.data);
				localStorage.setItem('restaurantData', JSON.stringify(response.data));
			}
		} catch (error) {
			console.error('RestaurantAuthContext: Failed to refresh restaurant data:', error);
		}
	};

	return (
		<RestaurantAuthContext.Provider value={{ 
			isRestaurantLoggedIn, 
			restaurantUser, 
			isLoading, 
			error, 
			login, 
			logout, 
			updateRestaurantUser,
			refreshRestaurantData
		}}>
			{children}
		</RestaurantAuthContext.Provider>
	);
};

export const useRestaurantAuth = () => {
	const ctx = useContext(RestaurantAuthContext);
	if (!ctx) throw new Error('useRestaurantAuth must be used within RestaurantAuthProvider');
	return ctx;
};


