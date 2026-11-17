import React from 'react'
import { Linking, Platform, Pressable, Text, View } from 'react-native'

export default function DemoHeader () {
  if (Platform.OS !== 'web') return null
  return (
    <View style={{ padding: 10, backgroundColor: '#fff5d7', borderBottomWidth: 1, borderBottomColor: '#dfd5b9' }}>
      <Text>DeliverUS · Pedidos de demostración. Usa datos ficticios.</Text>
      <Pressable accessibilityRole='link' onPress={() => Linking.openURL('/customer/')}>
        <Text style={{ color: '#18583f', textDecorationLine: 'underline', paddingTop: 4 }}>Abrir app de clientes</Text>
      </Pressable>
    </View>
  )
}
