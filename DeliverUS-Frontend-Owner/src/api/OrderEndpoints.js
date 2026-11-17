import { get, patch } from './helpers/ApiRequestsHelper'

export const getRestaurantOrders = restaurantId => get(`restaurants/${restaurantId}/orders`)
export const advanceOrder = (orderId, action) => patch(`orders/${orderId}/${action}`)
