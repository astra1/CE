/*******************************************************************************
 * Copyright 2018 T Mobile, Inc. or its affiliates. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.tmobile.pacbot.azure.inventory.collector;

import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import com.tmobile.pacbot.azure.inventory.vo.SubscriptionVH;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.ssl.SSLContextBuilder;
import org.apache.http.ssl.TrustStrategy;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The Class Util.
 */
public class Util {

	private static Logger log = LoggerFactory.getLogger(Util.class);
	public static AtomicInteger eCount=new AtomicInteger(0);

	/**
	 * Instantiates a new util.
	 */
	private Util() {

	}

	/**
	 * Base 64 decode.
	 *
	 * @param encodedStr
	 *            the encoded str
	 * @return the string
	 */
	public static String base64Decode(String encodedStr) {
		return new String(Base64.getDecoder().decode(encodedStr));
	}

	public static String base64Encode(String str) {
		return Base64.getEncoder().encodeToString(str.getBytes());
	}

	public static Map<String, Object> getHeader(String base64Creds) {
		Map<String, Object> authToken = new HashMap<>();
		authToken.put("Content-Type", ContentType.APPLICATION_JSON.toString());
		authToken.put("Authorization", "Basic " + base64Creds);
		return authToken;
	}

	public static String httpGetMethodWithHeaders(String url, Map<String, Object> headers) throws Exception {
		String json = null;

		HttpGet get = new HttpGet(url);
		CloseableHttpClient httpClient = null;
		if (headers != null && !headers.isEmpty()) {
			for (Map.Entry<String, Object> entry : headers.entrySet()) {
				get.setHeader(entry.getKey(), entry.getValue().toString());
			}
		}
		try {
			httpClient = getHttpClient();
			CloseableHttpResponse res = httpClient.execute(get);
			if (res.getStatusLine().getStatusCode() == 200) {
				json = EntityUtils.toString(res.getEntity());
			}
		} finally {
			if (httpClient != null) {
				httpClient.close();
			}
		}
		return json;
	}

	private static CloseableHttpClient getHttpClient() {
		CloseableHttpClient httpClient = null;
		try {
			httpClient = HttpClientBuilder.create().setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE)
					.setSSLContext(new SSLContextBuilder().loadTrustMaterial(null, new TrustStrategy() {
						@Override
						public boolean isTrusted(X509Certificate[] arg0, String arg1) throws CertificateException {
							return true;
						}
					}).build()).build();
		} catch (KeyManagementException | NoSuchAlgorithmException | KeyStoreException e) {
			log.error("Error in HttpUtil post ", e);
		}
		return httpClient;
	}

	public static String httpPostMethodWithHeaders(String url, Map<String, Object> headers) throws Exception {
		String json = null;

		HttpPost post = new HttpPost(url);
		CloseableHttpClient httpClient = null;
		if (headers != null && !headers.isEmpty()) {
			for (Map.Entry<String, Object> entry : headers.entrySet()) {
				post.setHeader(entry.getKey(), entry.getValue().toString());
			}
		}
		try {
			httpClient = getHttpClient();
			CloseableHttpResponse res = httpClient.execute(post);
			if (res.getStatusLine().getStatusCode() == 200) {
				json = EntityUtils.toString(res.getEntity());
			}
		} finally {
			if (httpClient != null) {
				httpClient.close();
			}
		}
		return json;
	}

	public static String removeFirstSlash(String resourceId) {
		if (resourceId != null && resourceId.startsWith("/")) {
			return resourceId.substring(1);
		}
		return resourceId;

	}

	public static Map<String, String> tagsList(Map<String, Map<String, String>> tagMap, String resourceGroupName,
			Map<String, String> tags) {

		Map<String, String> tagsFinal = new HashMap<String, String>();
		if (tagMap.get(resourceGroupName.toLowerCase()) != null) {
			tagsFinal.putAll(tagMap.get(resourceGroupName.toLowerCase()));
			tagsFinal.putAll(tags);
			return tagsFinal;
		} else {
			return tags;
		}

	}
	public static String getResourceGroupNameFromId(String id)
	{
		//only if "resourceGroups" is part of id attribute fetch from it
		if(id.indexOf("resourceGroups")!=-1){
		int beginningIndex=id.indexOf("resourceGroups")+15;
		return id.substring(beginningIndex,id.indexOf('/',beginningIndex+2));
		}
		else
		return null;


	}
	public static String getRegionValue(SubscriptionVH subscription,String region)
	{
		return subscription.getRegions().get(region)!=null?subscription.getRegions().get(region):region;
	}
}
