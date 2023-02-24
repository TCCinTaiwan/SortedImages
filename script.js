new Vue({
  el: '#app',
  data: {
    phase: 'upload',
    photos: [],
    photoMap: {},
    sortedPhotos: [],
    showChooseDialog: false,
    leftImage: {},
    rightImage: {},
  },
  methods: {
    // 上傳，增加圖片清單
    handleUpload(event) {
      this.phase = 'upload';

      const {
        files
      } = event.target;
      const fileReaders = [];

      for (let i = 0; i < files.length; i++) {
        fileReaders.push(new Promise((resolve, reject) => {
          const fileReader = new FileReader();

          fileReader.readAsDataURL(files[i]);

          fileReader.onload = () => {
            const photo = {
              src: fileReader.result,
            };

            // 如果重複丟錯誤
            if (this.photos.some((item) => item.src === photo.src)) {
              reject(new Error('Duplicate image'));
            } else {
              resolve(photo);
            }
          };
        }));
      }

      Promise.all(fileReaders.map(p => p.catch(e => e)))
        .then(results => {
          const photos = results.filter(result => !(result instanceof Error));

          this.photos.push(...photos);
        })
        .catch(error => {
          console.error(error.message);
        });
    },
    // 從圖片清單移除
    deletePhoto(index) {
      this.photos.splice(index, 1);
    },
    // 清空圖片清單
    clearPhotos() {
      this.photos = [];
    },
    // 排序圖片
    async sortPhotos() {
      this.phase = 'sort';

      // 合併演算法
      const mergeSort = async (arr, compare) => {
        const merge = async (left, right) => {
          const result = [];

          while (left.length > 0 && right.length > 0) {
            const chosen = await compare(left[0], right[0]) <= -1 ? left : right;

            result.push(chosen.shift());
          }

          return result.concat(left.length ? left : right);
        };

        const mergeSortRec = async (arr) => {
          if (arr.length === 1) {
            return arr;
          } else {
            const middle = Math.floor(arr.length / 2);
            const left = arr.slice(0, middle);
            const right = arr.slice(middle);

            return await merge(await mergeSortRec(left), await mergeSortRec(right));
          }
        };

        return await mergeSortRec(arr);
      };

      const compare = (a, b) => {
        this.leftImage = a;
        this.rightImage = b;
        this.showChooseDialog = true;

        return new Promise((resolve) => {
          this.$once('chosen', (result) => {
            this.showChooseDialog = false;
            this.leftImage = {};
            this.rightImage = {};

            resolve(result);
          });
        });
      };

      this.sortedPhotos = await mergeSort(this.photos, compare);
      this.phase = 'upload';
    },
    // 選擇右邊那張圖片
    chooseLeft() {
      this.$emit('chosen', -1);
    },
    // 選擇左邊那張圖片
    chooseRight() {
      this.$emit('chosen', 1);
    },
  },
});
