<template>
  <ol ref="songListRef">
    <li
      :class="'marquee'"
      v-for="(song, i) in songs"
      :key="'sc' + i"
      @click.left="copySong(song)"
      @click.right="removeSong(song)"
      @contextmenu="handler($event)"
    >
      <span>{{ song.name }} {{ song.username }}</span>
    </li>
  </ol>
</template>

<script>
import * as pronunciation from "@/utils/pronunciation";
import * as chatConfig from "@/api/chatConfig";
import * as chat from "@/api/chat";
import ChatClientRelay from "@/api/chat/ChatClientRelay";

export default {
  name: "Song",
  components: {},
  props: {
    roomKeyType: {
      type: Number,
      default: 1
    },
    roomKeyValue: {
      type: [Number, String],
      default: null
    },
    strConfig: {
      type: Object,
      default: () => ({})
    }
  },
  mounted() {
    if (document.visibilityState === "visible") {
      this.init();
    } else {
      // 当前窗口不可见，延迟到可见时加载，防止OBS中一次并发太多请求（OBS中浏览器不可见时也会加载网页，除非显式设置）
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    }
  },
  beforeDestroy() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    if (this.chatClient) {
      this.chatClient.stop();
    }
  },
  data() {
    return {
      config: chatConfig.deepCloneDefaultConfig(),
      chatClient: null,
      songs: []
    };
  },
  methods: {
    init() {
      this.initChatClient();
      if (this.config.giftUsernamePronunciation !== "") {
        this.pronunciationConverter =
          new pronunciation.PronunciationConverter();
        this.pronunciationConverter.loadDict(
          this.config.giftUsernamePronunciation
        );
      }
      // 提示用户已加载
      this.$message({
        message: "Loaded",
        duration: 500
      });
    },
    handler(e) {
      e.preventDefault();
    },
    toObjIfJson(str) {
      if (typeof str !== "string") {
        return str;
      }
      try {
        return JSON.parse(str);
      } catch {
        return {};
      }
    },
    initChatClient() {
      let roomKey = {
        type: this.roomKeyType,
        value: this.roomKeyValue
      };
      this.chatClient = new ChatClientRelay(roomKey, this.config.autoTranslate);
      this.chatClient.onFatalError = this.onFatalError;
      this.chatClient.onInitSong = this.onInitSong;
      this.chatClient.onAddSong = this.onAddSong;
      this.chatClient.onRemoveSong = this.onRemoveSong;
      this.chatClient.start();
    },
    async initTextEmoticons() {
      if (this.config.autoRenderOfficialSmallEmoji) {
        this.textEmoticons = await chat.getTextEmoticons();
      }
    },

    start() {
      this.chatClient.start();
    },
    stop() {
      this.chatClient.stop();
    },
    onFatalError(error) {
      this.$message.error({
        message: error.toString(),
        duration: 10 * 1000
      });
      this.chatClient.stop();

      if (error.type === chat.FATAL_ERROR_TYPE_AUTH_CODE_ERROR) {
        // Read The Fucking Manual
        this.$router.push({
          name: "help"
        });
      }
    },
    onVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return;
      }
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
      this.init();
    },
    onInitSong(data) {
      if (data == null) return;
      for (let song of data) this.songs.push(song);
    },
    onAddSong(song) {
      this.songs.push(song);
    },
    onRemoveSong(data) {
      let song = this.songs.find((x) => x.name == data.name);
      if (song != null) {
        this.songs.splice(this.songs.indexOf(song), 1);
      }
    },
    copySong(song) {
      this.$message({
        message: "复制成功",
        type: "success",
        duration: 500
      });
      navigator.clipboard.writeText(song.name);
    },
    removeSong(song) {
      navigator.clipboard.writeText(song.name);
      this.chatClient.removeSong(song);
    }
  }
};
</script>
<style src="../assets/css/song/songlist.css" scoped></style>
