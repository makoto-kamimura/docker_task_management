import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { COMMON, RESUME } from '@shared/copy'
import { colors } from '../../theme'

interface ResumePreviewModalProps {
  visible: boolean
  /** renderResumeHtml(..., { preview: true }) の HTML。PDF と同じ体裁を A4 の紙として並べる。 */
  html: string
  onClose: () => void
}

/**
 * 履歴書の見本を全画面で見せる。スマホは入力欄と横に並べる幅がないので、Web の左固定の見本の代わりにここで開く。
 * 見本は A4 の幅で描いて画面幅に縮めてあるので、ピンチで拡大して細部を確かめられる。
 */
export function ResumePreviewModal({ visible, html, onClose }: ResumePreviewModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{RESUME.previewTitle}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" testID="resume-preview-close">
            <Text style={styles.close}>{COMMON.close}</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>{RESUME.previewHint}</Text>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          accessibilityLabel={RESUME.previewLabel}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  close: { fontSize: 16, color: colors.accent },
  hint: { fontSize: 12, color: colors.textMuted, paddingHorizontal: 20, paddingBottom: 8 },
  webview: { flex: 1, backgroundColor: '#e9e8ee' },
})
