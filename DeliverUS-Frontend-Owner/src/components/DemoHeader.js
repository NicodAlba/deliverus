import React from 'react'
import { Linking, Platform, Pressable, Text, View } from 'react-native'
import { resetDemo } from '../../../demo/staticApi'

export default function DemoHeader () {
  if (Platform.OS !== 'web') return null
  const isStatic = process.env.EXPO_PUBLIC_STATIC_DEMO === 'true'
  const appRoot = process.env.EXPO_PUBLIC_APP_ROOT || ''
  return (
    <View style={{ flexShrink: 0, padding: 10, backgroundColor: '#fff5d7', borderBottomWidth: 1, borderBottomColor: '#dfd5b9' }}>
      <Text>{isStatic ? 'Demo gratuita · Los cambios se guardan sólo en este navegador. Usa datos ficticios.' : 'DeliverUS · Pedidos de demostración. Usa datos ficticios.'}</Text>
      {isStatic && <Text>Cliente customer1@customer.com · Propietario owner1@owner.com · Contraseña secret</Text>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
        <Pressable accessibilityRole='link' onPress={() => Linking.openURL(appRoot + '/customer/')}>
          <Text style={{ color: '#18583f', textDecorationLine: 'underline' }}>Abrir app de clientes</Text>
        </Pressable>
        {isStatic && <Pressable accessibilityRole='button' onPress={() => {
          if (window.confirm('¿Restaurar el catálogo y borrar los pedidos y las ediciones de esta demo en el navegador?')) resetDemo()
        }}>
          <Text style={{ color: '#18583f', textDecorationLine: 'underline' }}>Restaurar demo</Text>
        </Pressable>}
      </View>
    </View>
  )
}
