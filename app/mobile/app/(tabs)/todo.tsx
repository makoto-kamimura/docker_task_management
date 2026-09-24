import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { COMMON, TODO } from '@shared/copy'
import { queries } from '@shared/queries'
import { buildBreakdownItems } from '@shared/tasks'
import { BreakdownCard } from '../../src/components/today/BreakdownCard'
import { Hint, Screen } from '../../src/components/ui'

/**
 * やりたいことの細分化（単独で開いたとき）。ふだんは優先度が確定した時点で
 * 「今日の一歩」の中に 1 件ずつ出るが、まとめて分解したいとき用に画面は残してある。
 */
export default function TodoScreen() {
  const { data: tasks, isLoading } = useQuery(queries.taskTree())
  const items = useMemo(() => buildBreakdownItems(tasks ?? []), [tasks])

  return (
    <Screen>
      <Hint>{TODO.description}</Hint>

      <View style={styles.list}>
        {isLoading && <ActivityIndicator accessibilityLabel={COMMON.loading} />}
        {!isLoading && items.length === 0 && <Hint>{TODO.empty}</Hint>}
        {items.map((item) => (
          <BreakdownCard key={item.task.id} item={item} />
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { marginTop: 16 },
})
