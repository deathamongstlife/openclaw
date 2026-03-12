package ai.jarvis.app.ui

import androidx.compose.runtime.Composable
import ai.jarvis.app.MainViewModel
import ai.jarvis.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
