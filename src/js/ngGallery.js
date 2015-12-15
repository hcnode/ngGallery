angular.module('jkuri.gallery', [])

	.directive('ngGallery', ['$document', '$timeout', '$q', '$templateCache', function($document, $timeout, $q, $templateCache) {
		'use strict';

		var defaults = {
			baseClass   : 'ng-gallery',
			thumbClass  : 'img-thumbnail img-responsive ng-thumb',
			templateUrl : 'ng-gallery.html'
		};

		var keys_codes = {
			enter : 13,
			esc   : 27,
			left  : 37,
			right : 39
		};

		function setScopeValues(scope, attrs) {
			scope.baseClass = scope.class || defaults.baseClass;
			scope.thumbClass = scope.thumbClass || defaults.thumbClass;
			scope.thumbsNum = scope.thumbsNum || 3; // should be odd
		}

		var template_url = defaults.templateUrl;
		// Set the default template
		$templateCache.put(template_url,
			'<div class="{{ baseClass }}">' +
			'	<div ng-show="images.length > 0">' +
			'		<i class="fa fa-th fa-3x" style="margin-right: 10px;" ng-click="setNormalPreview()"></i>' +
			'		<i class="fa fa-th-large fa-3x" ng-click="setLargePreview()"></i>' +
			'	</div>' +
			'  <div ng-repeat="i in images">' +
			'    <img ng-src="{{ i.thumb }}" ng-class="getClass($index)" style="{{ thumbSize }}" ng-click="openGallery($index)" alt="Image {{ $index + 1 }}" />' +
			'  </div>' +
			'</div>' +
			'<div class="ng-overlay" ng-show="opened">' +
			'</div>' +
			'<div ng-show="images.length == 0" style="position: absolute;top:100px;left:100px;font-size: larger">Image not found</div>' +
			'<div class="ng-gallery-content" ng-show="opened">' +
			'  <div class="uil-ring-css" ng-show="loading"><div></div></div>' +
			'  <a class="edit-popup" ng-click="edit()" ng-show="editShow"><i class="fa fa-edit"></i></a>' +
			'  <a class="compress-popup" ng-click="compress()" ng-show="imgExpand"><i class="fa fa-compress"></i></a>' +
			'  <a class="expand-popup" ng-click="expand()" ng-show="!imgExpand"><i class="fa fa-expand"></i></a>' +
			'  <a class="close-popup" ng-click="closeGallery()"><i class="fa fa-close"></i></a>' +
			'  <a class="nav-left" ng-click="prevImage()"><i class="fa fa-angle-left"></i></a>' +
			'  <div style="height: 630px;overflow: scroll"><img ng-src="{{ img }}" ng-click="nextImage()" ng-show="!loading" class="effect" style="{{ imgExpand }}" /></div>' +
			'  <a class="nav-right" ng-click="nextImage()"><i class="fa fa-angle-right"></i></a>' +
			'  <span class="info-text">{{ index + 1 }}/{{ images.length }} - {{ description }}</span>' +
			'  <div class="ng-thumbnails-wrapper">' +
			'    <div class="ng-thumbnails slide-left">' +
			'      <div ng-repeat="i in images">' +
			'        <img ng-src="{{ i.thumb }}" ng-class="{\'active\': index === $index}" ng-click="changeImage($index)" />' +
			'      </div>' +
			'    </div>' +
			'  </div>' +
			'</div>'
		);

		return {
			restrict: 'EA',
			scope: {
				images: '=',
				thumbsNum: '@',
				selectMode: '@',
				editShow:'@'
			},
			templateUrl: function(element, attrs) {
				return attrs.templateUrl || defaults.templateUrl;
			},
			link: function (scope, element, attrs) {
				setScopeValues(scope, attrs);

				if (scope.thumbsNum >= 11) {
					scope.thumbsNum = 11;
				}

				var $body = $document.find('body');
				var $thumbwrapper = angular.element(document.querySelectorAll('.ng-thumbnails-wrapper'));
				var $thumbnails = angular.element(document.querySelectorAll('.ng-thumbnails'));

				scope.index = 0;
				scope.opened = false;

				scope.thumb_wrapper_width = 0;
				scope.thumbs_width = 0;
				scope.selectedItems = {};

				scope.$on("selectMode",
					function (event, msg) {
						scope.selectMode = msg;
					});

				scope.$on("getSelectFile",
					function (event, msg) {
						scope.$emit("saveSelectFile", scope.selectedItems);
					});

				scope.getClass = function (i) {
					var cls = scope.thumbClass;
					var img = scope.images[i].img;
					if(scope.selectedItems[img]){
						cls += ' bgaqua';
					}
					return cls;
				};
				var loadImage = function (i) {
					var deferred = $q.defer();
					var image = new Image();

					image.onload = function () {
						scope.loading = false;
						if (typeof this.complete === false || this.naturalWidth === 0) {
							deferred.reject();
						}
						deferred.resolve(image);
					};

					image.onerror = function () {
						deferred.reject();
					};

					image.src = scope.images[i].img;
					scope.loading = true;

					return deferred.promise;
				};

				var showImage = function (i) {
					loadImage(scope.index).then(function(resp) {
						scope.img = resp.src;
						smartScroll(scope.index);
					});
					scope.description = scope.images[i].description || '';
				};

				scope.changeImage = function (i) {
					scope.index = i;
					loadImage(scope.index).then(function(resp) {
						scope.img = resp.src;
						smartScroll(scope.index);
					});
				};

				scope.nextImage = function () {
					scope.index += 1;
					if (scope.index === scope.images.length) {
						scope.index = 0;
					}
					showImage(scope.index);
				};

				scope.prevImage = function () {
					scope.index -= 1;
					if (scope.index < 0) {
						scope.index = scope.images.length - 1;
					}
					showImage(scope.index);
				};

				scope.openGallery = function (i) {
					if(scope.selectMode){
						scope.selectedItems[scope.images[i].img] = !scope.selectedItems[scope.images[i].img];
					}else {
						if (typeof i !== undefined) {
							scope.index = i;
							showImage(scope.index);
						}
						scope.opened = true;

						$timeout(function () {
							var calculatedWidth = calculateThumbsWidth();
							scope.thumbs_width = calculatedWidth.width;
							$thumbnails.css({width: calculatedWidth.width + 'px'});
							$thumbwrapper.css({width: calculatedWidth.visible_width + 'px'});
							smartScroll(scope.index);
						});
					}
				};

				scope.closeGallery = function () {
					scope.opened = false;
				};
				scope.expand = function(){
					scope.imgExpand = "max-height:none;max-width:none;top:100%;";
				};
				scope.compress = function(){
					scope.imgExpand = "";
				};
				scope.edit = function(){
					window.open("editor.html?image=" + encodeURIComponent(scope.img));
				};
				scope.setNormalPreview = function () {
					scope.thumbSize = "";
				};
				scope.setLargePreview = function () {
					scope.thumbSize = "height:200px";
				};
				$body.bind('keydown', function(event) {
					if (!scope.opened) {
						return;
					}
					var which = event.which;
					if (which === keys_codes.esc) {
						scope.closeGallery();
					} else if (which === keys_codes.right || which === keys_codes.enter) {
						scope.nextImage();
					} else if (which === keys_codes.left) {
						scope.prevImage();
					}

					scope.$apply();
				});

				var calculateThumbsWidth = function () {
					var width = 0,
						visible_width = 0;
					angular.forEach($thumbnails.find('img'), function(thumb) {
						width += thumb.clientWidth;
						width += 10; // margin-right
						visible_width = thumb.clientWidth + 10;
					});
					return {
						width: width,
						visible_width: visible_width * scope.thumbsNum
					};
				};

				var smartScroll = function (index) {
					$timeout(function() {
						var len = scope.images.length,
							width = scope.thumbs_width,
							current_scroll = $thumbwrapper[0].scrollLeft,
							item_scroll = parseInt(width / len, 10),
							i = index + 1,
							s = Math.ceil(len / i);

						$thumbwrapper[0].scrollLeft = 0;
						$thumbwrapper[0].scrollLeft = i * item_scroll /*- (s * item_scroll)*/;
					}, 100);
				};

			}
		};

	}]);
