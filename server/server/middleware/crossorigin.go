// Copyright 2017-2020 The ShadowEditor Authors. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.
//
// For more information, please visit: https://github.com/tengge1/ShadowEditor
// You can also visit: https://gitee.com/tengge1/ShadowEditor

package middleware

import (
	"net/http"

	"github.com/tengge1/shadoweditor/server/helper"
)

// CrossOriginHandler is responsible for cross origin.
func CrossOriginHandler(w http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	helper.EnableCrossDomain(w, r)
	next.ServeHTTP(w, r)
}