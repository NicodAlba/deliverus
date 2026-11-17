import catalog from './catalog.json'

const storageKey = 'deliverus-static-demo-v1'

function initialState () {
  return JSON.parse(JSON.stringify(catalog))
}

function readState () {
  const stored = localStorage.getItem(storageKey)
  return stored ? JSON.parse(stored) : initialState()
}

export function resetDemo () {
  localStorage.removeItem(storageKey)
  localStorage.removeItem('deliverus-customer-user')
  localStorage.removeItem('deliverus-owner-user')
  location.reload()
}

export function imageUrl (base, value) {
  return value?.startsWith('data:image/') ? value : base + '/' + value
}

function fail (status, message) {
  const error = new Error(message)
  error.status = status
  throw error
}

function requireRole (user, role) {
  if (!user) fail(401, 'Accede con una cuenta de demostración.')
  if (role && user.userType !== role) fail(403, 'Esta operación corresponde al otro rol.')
}

function getRestaurant (state, id) {
  const restaurant = state.restaurants.find(item => item.id === Number(id))
  if (!restaurant) fail(404, 'Restaurante inexistente.')
  return restaurant
}

function requireOwner (state, id, user) {
  requireRole(user, 'owner')
  const restaurant = getRestaurant(state, id)
  if (restaurant.userId !== user.id) fail(403, 'El restaurante pertenece a otro propietario.')
  return restaurant
}

function productDetail (state, product) {
  return { ...product, productCategory: state.productCategories.find(item => item.id === product.productCategoryId) }
}

function restaurantDetail (state, restaurant) {
  return {
    ...restaurant,
    restaurantCategory: state.restaurantCategories.find(item => item.id === restaurant.restaurantCategoryId),
    products: state.products.filter(item => item.restaurantId === restaurant.id).map(item => productDetail(state, item))
  }
}

function orderDetail (state, order) {
  return {
    ...order,
    restaurant: restaurantDetail(state, getRestaurant(state, order.restaurantId)),
    status: order.deliveredAt ? 'delivered' : order.sentAt ? 'sent' : order.startedAt ? 'in process' : 'pending',
    products: order.lines.map(line => ({
      ...productDetail(state, state.products.find(product => product.id === line.productId) || { id: line.productId, name: 'Producto eliminado' }),
      OrderProducts: { quantity: line.quantity, unityPrice: line.unityPrice }
    }))
  }
}

function nextId (items) {
  return Math.max(0, ...items.map(item => item.id)) + 1
}

async function requestBody (config) {
  if (typeof config.data === 'string') return JSON.parse(config.data)
  if (!(config.data instanceof FormData)) return config.data || {}
  const body = {}
  for (const [key, value] of config.data.entries()) {
    if (value instanceof File) {
      if (!['image/png', 'image/jpeg'].includes(value.type) || value.size >= 2000000) fail(422, 'Elige una imagen PNG/JPEG de menos de 2 MB.')
      body[key] = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(value)
      })
    } else {
      body[key] = value
    }
  }
  return body
}

function productValues (body) {
  if (!body.name || !Number.isFinite(Number(body.price)) || Number(body.price) < 0) fail(422, 'Revisa el nombre y el precio.')
  return {
    name: body.name, description: body.description || '', price: Number(body.price),
    order: Number(body.order) || 0, availability: body.availability === true || body.availability === 'true',
    productCategoryId: Number(body.productCategoryId),
    ...(body.image ? { image: body.image } : {})
  }
}

function restaurantValues (body) {
  if (!body.name || !body.address || !Number.isFinite(Number(body.shippingCosts)) || Number(body.shippingCosts) < 0) fail(422, 'Revisa el nombre, la dirección y los gastos de envío.')
  return {
    name: body.name, address: body.address, description: body.description || '',
    postalCode: body.postalCode, url: body.url, email: body.email, phone: body.phone,
    shippingCosts: Number(body.shippingCosts), restaurantCategoryId: Number(body.restaurantCategoryId),
    ...(body.logo ? { logo: body.logo } : {}),
    ...(body.heroImage ? { heroImage: body.heroImage } : {})
  }
}

function orderValues (state, body, restaurantId) {
  if (!body.address?.trim() || !body.products?.length) fail(422, 'Añade una dirección ficticia y al menos un producto.')
  const lines = body.products.map(line => {
    const product = state.products.find(item => item.id === Number(line.productId))
    const quantity = Number(line.quantity)
    if (!product || !product.availability || product.restaurantId !== restaurantId ||
        !Number.isInteger(quantity) || quantity < 1) fail(422, 'Revisa los productos y sus cantidades.')
    return { productId: product.id, quantity, unityPrice: product.price }
  })
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unityPrice, 0)
  const shippingCosts = subtotal >= 10 ? 0 : getRestaurant(state, restaurantId).shippingCosts
  return { address: body.address.trim(), lines, shippingCosts, price: Number((subtotal + shippingCosts).toFixed(2)) }
}

function dispatch (state, method, route, body, user) {
  const [resource, id, action] = route.split('/')
  if (resource === 'users') {
    if (method === 'post' && ['login', 'loginOwner'].includes(id)) {
      const role = id === 'loginOwner' ? 'owner' : 'customer'
      const account = state.users.find(item => item.email === body.email && item.userType === role)
      if (!account || body.password !== 'secret') fail(401, 'Usa la cuenta de demostración y la contraseña secret.')
      return { ...account, token: 'demo-' + role, tokenExpiration: '2099-01-01T00:00:00.000Z' }
    }
    if (id === 'isTokenValid') {
      const account = state.users.find(item => 'demo-' + item.userType === body.token)
      if (!account) fail(401, 'Accede a la demo.')
      return { ...account, token: body.token, tokenExpiration: '2099-01-01T00:00:00.000Z' }
    }
    if (id?.toLowerCase() === 'myrestaurants') {
      requireRole(user, 'owner')
      return state.restaurants.filter(item => item.userId === user.id).map(item => restaurantDetail(state, item))
    }
    fail(403, 'Los perfiles de la demo son fijos. Usa las cuentas indicadas.')
  }
  if (resource === 'restaurantCategories') return state.restaurantCategories
  if (resource === 'productCategories') return state.productCategories
  if (resource === 'restaurants') {
    if (!id && method === 'get') return state.restaurants.map(item => restaurantDetail(state, item))
    if (!id && method === 'post') {
      requireRole(user, 'owner')
      const restaurant = { ...restaurantValues(body), id: nextId(state.restaurants), userId: user.id, status: 'online' }
      state.restaurants.push(restaurant)
      return restaurantDetail(state, restaurant)
    }
    const restaurant = getRestaurant(state, id)
    if (action === 'orders') {
      requireOwner(state, id, user)
      return state.orders.filter(item => item.restaurantId === restaurant.id).map(item => orderDetail(state, item)).reverse()
    }
    if (action === 'products') return state.products.filter(item => item.restaurantId === restaurant.id).map(item => productDetail(state, item))
    if (method === 'get') return restaurantDetail(state, restaurant)
    requireOwner(state, id, user)
    if (method === 'put') Object.assign(restaurant, restaurantValues(body))
    if (method === 'delete') {
      if (state.orders.some(item => item.restaurantId === restaurant.id)) fail(409, 'El restaurante tiene pedidos de ejemplo.')
      state.restaurants = state.restaurants.filter(item => item.id !== restaurant.id)
      state.products = state.products.filter(item => item.restaurantId !== restaurant.id)
    }
    return restaurantDetail(state, restaurant)
  }
  if (resource === 'products') {
    if (id === 'popular') return state.products.slice(0, 3).map(item => ({
      ...productDetail(state, item), restaurant: restaurantDetail(state, getRestaurant(state, item.restaurantId))
    }))
    if (!id && method === 'post') {
      requireOwner(state, body.restaurantId, user)
      const product = { ...productValues(body), id: nextId(state.products), restaurantId: Number(body.restaurantId) }
      state.products.push(product)
      return productDetail(state, product)
    }
    const product = state.products.find(item => item.id === Number(id))
    if (!product) fail(404, 'Producto inexistente.')
    if (method === 'get') return productDetail(state, product)
    requireOwner(state, product.restaurantId, user)
    if (method === 'put') Object.assign(product, productValues(body))
    if (method === 'delete') {
      if (state.orders.some(order => order.lines.some(line => line.productId === product.id))) fail(409, 'El producto tiene pedidos de ejemplo.')
      state.products = state.products.filter(item => item.id !== product.id)
    }
    return productDetail(state, product)
  }
  if (resource === 'orders') {
    if (!id) {
      requireRole(user, 'customer')
      if (method === 'get') return state.orders.filter(item => item.userId === user.id).map(item => orderDetail(state, item)).reverse()
      const order = {
        ...orderValues(state, body, Number(body.restaurantId)), id: nextId(state.orders),
        userId: user.id, restaurantId: Number(body.restaurantId), createdAt: new Date().toISOString(),
        startedAt: null, sentAt: null, deliveredAt: null
      }
      state.orders.push(order)
      return orderDetail(state, order)
    }
    const order = state.orders.find(item => item.id === Number(id))
    if (!order) fail(404, 'Pedido inexistente.')
    if (user?.userType === 'owner') requireOwner(state, order.restaurantId, user)
    else {
      requireRole(user, 'customer')
      if (order.userId !== user.id) fail(403, 'El pedido pertenece a otro cliente.')
    }
    const detail = orderDetail(state, order)
    if (method === 'get') return detail
    if (method === 'patch') {
      requireRole(user, 'owner')
      const transitions = { confirm: ['pending', 'startedAt'], send: ['in process', 'sentAt'], deliver: ['sent', 'deliveredAt'] }
      const transition = transitions[action]
      if (!transition || detail.status !== transition[0]) fail(409, 'El estado del pedido ha cambiado.')
      order[transition[1]] = new Date().toISOString()
      return orderDetail(state, order)
    }
    requireRole(user, 'customer')
    if (detail.status !== 'pending') fail(409, 'El pedido ya está en preparación.')
    if (method === 'put') Object.assign(order, orderValues(state, body, order.restaurantId))
    if (method === 'delete') state.orders = state.orders.filter(item => item.id !== order.id)
    return orderDetail(state, order)
  }
  fail(404, 'Esta operación no está disponible en la demo.')
}

// Opt-in Axios transport for the free static demo. The normal API transport stays available.
export default async function staticApi (config) {
  let response
  try {
    const body = await requestBody(config)
    const token = String(config.headers.Authorization || '').replace(/^bearer /i, '')
    const run = () => {
      const state = readState()
      const user = state.users.find(item => 'demo-' + item.userType === token)
      const route = config.url.split('?')[0].replace(/^\/+|\/+$/g, '')
      const data = dispatch(state, config.method, route, body, user)
      if (config.method !== 'get') localStorage.setItem(storageKey, JSON.stringify(state))
      return data
    }
    const data = navigator.locks ? await navigator.locks.request(storageKey, run) : run()
    response = { status: 200, statusText: 'OK', data, config, headers: {}, request: null }
  } catch (error) {
    const message = error.name === 'QuotaExceededError' ? 'El almacenamiento del navegador está lleno. Restaura la demo para liberar espacio.' : error.message
    response = { status: error.status || 422, statusText: message, data: { errors: [{ msg: message }] }, config, headers: {}, request: null }
    const rejected = new Error(message)
    rejected.config = config
    rejected.response = response
    throw rejected
  }
  return response
}
