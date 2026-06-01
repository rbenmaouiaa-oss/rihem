import React from 'react'
import { View, Text } from 'react-native'

export default function DetailScreen({ route }: any) {
  const { type } = route.params

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold' }}>
        {type}
      </Text>
    </View>
  )
}