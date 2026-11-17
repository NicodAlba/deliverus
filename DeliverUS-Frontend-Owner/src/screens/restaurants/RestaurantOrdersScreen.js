import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getRestaurantOrders, advanceOrder } from '../../api/OrderEndpoints'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'

const actions = {
  pending: { route: 'confirm', label: 'Preparar pedido' },
  'in process': { route: 'send', label: 'Enviar pedido' },
  sent: { route: 'deliver', label: 'Marcar entregado' }
}

export default function RestaurantOrdersScreen ({ route }) {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setOrders(await getRestaurantOrders(route.params.id))
    } catch {
      setError('No se pudieron cargar los pedidos. Comprueba tu sesión y los permisos del restaurante.')
    } finally {
      setLoading(false)
    }
  }, [route.params.id])

  useFocusEffect(useCallback(() => { refresh() }, [refresh]))

  const advance = async order => {
    setSaving(true)
    setError('')
    try {
      await advanceOrder(order.id, actions[order.status].route)
      await refresh()
    } catch {
      setError('El estado pudo cambiar. Recarga los pedidos antes de reintentarlo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole='button' onPress={refresh} disabled={loading || saving} style={styles.button}>
        <TextRegular textStyle={styles.buttonText}>{loading ? 'Cargando…' : 'Actualizar pedidos'}</TextRegular>
      </Pressable>
      {!!error && <TextRegular>{error}</TextRegular>}
      <FlatList
        data={orders}
        keyExtractor={order => String(order.id)}
        ListEmptyComponent={<TextRegular>{loading ? 'Cargando pedidos…' : 'No hay pedidos.'}</TextRegular>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TextSemiBold>Pedido #{item.id} · {item.status}</TextSemiBold>
            <TextRegular>{item.address}</TextRegular>
            <TextRegular>Total {Number(item.price).toFixed(2)} €</TextRegular>
            {item.products?.map(product => (
              <TextRegular key={product.id}>{product.name} × {product.OrderProducts.quantity}</TextRegular>
            ))}
            {!!actions[item.status] && (
              <Pressable accessibilityRole='button' disabled={saving || loading} onPress={() => advance(item)} style={styles.button}>
                <TextRegular textStyle={styles.buttonText}>{actions[item.status].label}</TextRegular>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  card: { backgroundColor: 'white', padding: 16, marginBottom: 12, borderRadius: 8, gap: 6 },
  button: { backgroundColor: GlobalStyles.brandPrimary, padding: 12, marginVertical: 8, borderRadius: 6 },
  buttonText: { color: 'white', textAlign: 'center' }
})
